import json
from typing import Any, Optional, Union

# Hard cap on how long we'll wait on an AI provider before failing fast.
# Without this, a slow/hung upstream call can outlive proxy timeouts
# (Cloudflare/Nginx Proxy Manager), which turns into a bare connection
# reset for the client instead of a clean error.
AI_REQUEST_TIMEOUT = 45.0

PROVIDER_LABELS = {
    "anthropic": "Anthropic",
    "openai": "OpenAI",
    "gemini": "Google Gemini",
    "groq": "Groq",
}

# "smart" is used for higher-quality generation (cover letters, tailored CVs,
# learning plans, CV parsing); "fast" is used for cheaper/quicker calls
# (skill-gap extraction). The active ai_config's own model overrides this,
# for both tiers, if one is set.
PROVIDER_MODELS = {
    "anthropic": {
        "smart": "claude-sonnet-4-6",
        "fast": "claude-haiku-4-5-20251001",
        "options": ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
    },
    "openai": {
        "smart": "gpt-4o",
        "fast": "gpt-4o-mini",
        "options": ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
    },
    "gemini": {
        "smart": "gemini-2.5-pro",
        "fast": "gemini-2.5-flash",
        "options": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    },
    "groq": {
        "smart": "llama-3.3-70b-versatile",
        "fast": "llama-3.1-8b-instant",
        "options": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
    },
}


def get_provider(user) -> str:
    config = user.active_ai_config
    return config.provider if config else "anthropic"


def get_api_key(user) -> Optional[str]:
    config = user.active_ai_config
    return config.api_key if config else None


def get_model(user, tier: str = "smart") -> str:
    config = user.active_ai_config
    if config and config.model:
        return config.model
    return PROVIDER_MODELS[get_provider(user)][tier]


def missing_key_message(user, action: str) -> str:
    return f"Add an AI provider key in Settings and mark it active to {action}."


def _extract_json(raw: str) -> Union[dict, list]:
    """Pull the first valid JSON object or array out of a model response,
    tolerating markdown fences or commentary around it.

    Tries whichever structure (array or object) appears first in the string so
    that a response like `[{"id":…}]` is returned as a list, not the inner dict.
    """
    obj_start, obj_end = raw.find("{"), raw.rfind("}")
    arr_start, arr_end = raw.find("["), raw.rfind("]")

    has_obj = obj_start != -1 and obj_end > obj_start
    has_arr = arr_start != -1 and arr_end > arr_start

    # Build candidate list: outermost structure first
    candidates = []
    if has_arr and has_obj:
        if arr_start < obj_start:
            candidates = [raw[arr_start:arr_end + 1], raw[obj_start:obj_end + 1]]
        else:
            candidates = [raw[obj_start:obj_end + 1], raw[arr_start:arr_end + 1]]
    elif has_obj:
        candidates = [raw[obj_start:obj_end + 1]]
    elif has_arr:
        candidates = [raw[arr_start:arr_end + 1]]

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    raise ValueError(f"No valid JSON in AI response (first 500 chars): {raw[:500]!r}")


def _complete_anthropic(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key, timeout=AI_REQUEST_TIMEOUT)
    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _complete_openai(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=api_key, timeout=AI_REQUEST_TIMEOUT)
    response = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content
    if not content:
        finish = getattr(response.choices[0], "finish_reason", "unknown")
        raise RuntimeError(f"OpenAI returned empty content (finish_reason={finish}).")
    return content


def _complete_gemini(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel(model)
    response = gemini_model.generate_content(
        prompt,
        generation_config={"max_output_tokens": max_tokens},
        request_options={"timeout": AI_REQUEST_TIMEOUT},
    )
    return response.text


def _complete_groq(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    from groq import Groq

    client = Groq(api_key=api_key, timeout=AI_REQUEST_TIMEOUT)
    response = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content
    if not content:
        finish = getattr(response.choices[0], "finish_reason", "unknown")
        raise RuntimeError(f"Groq returned empty content (finish_reason={finish}). Model may not support this request format.")
    return content


_DISPATCH = {
    "anthropic": _complete_anthropic,
    "openai": _complete_openai,
    "gemini": _complete_gemini,
    "groq": _complete_groq,
}


def _is_rate_limit_error(e: Exception) -> bool:
    status = getattr(e, "status_code", None) or getattr(e, "code", None)
    if status == 429:
        return True
    text = str(e).lower()
    return "429" in text or "rate limit" in text or "quota" in text


def complete_text(prompt: str, user, tier: str = "smart", max_tokens: int = 2048) -> str:
    provider = get_provider(user)
    api_key = get_api_key(user)
    model = get_model(user, tier)
    try:
        return _DISPATCH[provider](prompt, api_key, model, max_tokens)
    except Exception as e:
        if _is_rate_limit_error(e):
            raise RuntimeError(
                f"{PROVIDER_LABELS[provider]} rate limit or quota exceeded. "
                "Wait a bit and try again, or switch provider/model in Settings."
            ) from e
        raise


def complete_json(prompt: str, user, tier: str = "smart", max_tokens: int = 2048) -> Any:
    raw = complete_text(prompt, user, tier=tier, max_tokens=max_tokens)
    return _extract_json(raw)
