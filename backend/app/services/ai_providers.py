import json
from typing import Any, Optional, Union

PROVIDER_LABELS = {
    "anthropic": "Anthropic",
    "openai": "OpenAI",
    "gemini": "Google Gemini",
}

PROVIDER_KEY_FIELD = {
    "anthropic": "anthropic_api_key",
    "openai": "openai_api_key",
    "gemini": "gemini_api_key",
}

# "smart" is used for higher-quality generation (cover letters, tailored CVs,
# learning plans, CV parsing); "fast" is used for cheaper/quicker calls
# (skill-gap extraction). Users can override with a custom model name via
# ai_model, in which case it's used for both tiers.
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
        "smart": "gemini-1.5-pro",
        "fast": "gemini-1.5-flash",
        "options": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
    },
}


def get_provider(user) -> str:
    return user.ai_provider or "anthropic"


def get_api_key(user) -> Optional[str]:
    field = PROVIDER_KEY_FIELD[get_provider(user)]
    return getattr(user, field, None)


def get_model(user, tier: str = "smart") -> str:
    if user.ai_model:
        return user.ai_model
    return PROVIDER_MODELS[get_provider(user)][tier]


def missing_key_message(user, action: str) -> str:
    label = PROVIDER_LABELS[get_provider(user)]
    return f"Add your {label} API key in Settings to {action}."


def _extract_json(raw: str) -> Union[dict, list]:
    """Pull the first valid JSON object or array out of a model response,
    tolerating markdown fences or commentary around it."""
    candidates = []
    obj_start, obj_end = raw.find("{"), raw.rfind("}")
    if obj_start != -1 and obj_end != -1:
        candidates.append(raw[obj_start : obj_end + 1])
    arr_start, arr_end = raw.find("["), raw.rfind("]")
    if arr_start != -1 and arr_end != -1:
        candidates.append(raw[arr_start : arr_end + 1])
    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    raise ValueError(f"No valid JSON in AI response: {raw[:200]}")


def _complete_anthropic(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _complete_openai(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content or ""


def _complete_gemini(prompt: str, api_key: Optional[str], model: str, max_tokens: int) -> str:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel(model)
    response = gemini_model.generate_content(
        prompt,
        generation_config={"max_output_tokens": max_tokens},
    )
    return response.text


_DISPATCH = {
    "anthropic": _complete_anthropic,
    "openai": _complete_openai,
    "gemini": _complete_gemini,
}


def complete_text(prompt: str, user, tier: str = "smart", max_tokens: int = 2048) -> str:
    provider = get_provider(user)
    api_key = get_api_key(user)
    model = get_model(user, tier)
    return _DISPATCH[provider](prompt, api_key, model, max_tokens)


def complete_json(prompt: str, user, tier: str = "smart", max_tokens: int = 2048) -> Any:
    raw = complete_text(prompt, user, tier=tier, max_tokens=max_tokens)
    return _extract_json(raw)
