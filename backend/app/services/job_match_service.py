import json
from typing import Any, Dict, List

import anthropic

from app.config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _build_profile_summary(profile, full_name: str) -> str:
    lines = [f"Name: {full_name}"]
    if profile.headline:
        lines.append(f"Headline: {profile.headline}")
    if profile.summary:
        lines.append(f"Summary: {profile.summary}")
    if profile.location:
        lines.append(f"Location: {profile.location}")

    if profile.work_experiences:
        lines.append("\nWork Experience:")
        for exp in profile.work_experiences[:5]:
            date_range = f"{exp.start_date or '?'} – {'Present' if exp.is_current else (exp.end_date or '?')}"
            lines.append(f"  • {exp.title} at {exp.company} ({date_range})")
            if exp.description:
                lines.append(f"    {exp.description[:200]}")

    if profile.educations:
        lines.append("\nEducation:")
        for edu in profile.educations[:3]:
            lines.append(f"  • {edu.degree or ''} {edu.field_of_study or ''} — {edu.institution}")

    if profile.skills:
        by_cat: Dict[str, List[str]] = {}
        for s in profile.skills:
            by_cat.setdefault(s.category or "Other", []).append(s.name)
        lines.append("\nSkills:")
        for cat, names in by_cat.items():
            lines.append(f"  {cat}: {', '.join(names)}")

    if profile.certifications:
        lines.append("\nCertifications: " + ", ".join(c.name for c in profile.certifications[:5]))

    return "\n".join(lines)


def batch_score_jobs(jobs: List[Dict[str, Any]], profile, full_name: str) -> List[Dict[str, Any]]:
    """
    Score up to 20 jobs against the candidate profile.
    Returns list of {external_id, score, summary}.
    """
    profile_text = _build_profile_summary(profile, full_name)

    # Build compact job list for the prompt (title + first 400 chars of description)
    job_snippets = []
    for j in jobs[:20]:
        desc_preview = (j.get("description") or "")[:400]
        job_snippets.append({
            "id": j["external_id"],
            "title": j["title"],
            "company": j.get("company", ""),
            "description_preview": desc_preview,
        })

    prompt = f"""You are a career advisor. Score how well each job matches this candidate.

CANDIDATE PROFILE:
{profile_text}

JOBS TO SCORE:
{json.dumps(job_snippets, ensure_ascii=False, indent=2)}

Return ONLY a JSON array. Each element:
{{
  "id": "<job id from input>",
  "score": <integer 0-100>,
  "summary": "<one sentence: why this matches or doesn't>"
}}

Score criteria:
- 80-100: strong skill + experience match
- 60-79: partial match, some gaps
- 40-59: tangential match
- 0-39: poor match

Return the array sorted by score descending."""

    message = _client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1:
        return []
    scores = json.loads(raw[start: end + 1])
    return scores


def generate_cover_letter_and_tweaks(job: Dict[str, Any], profile, full_name: str) -> Dict[str, Any]:
    """
    Generate a tailored cover letter + CV tweaks for a single job.
    Returns {cover_letter: str, cv_tweaks: list[str]}.
    """
    profile_text = _build_profile_summary(profile, full_name)
    desc = (job.get("description") or "")[:3000]

    prompt = f"""You are an expert career coach helping a candidate apply for a job.

CANDIDATE PROFILE:
{profile_text}

JOB:
Title: {job.get('title', '')}
Company: {job.get('company', '')}
Location: {job.get('location', '')}
Description:
{desc}

Tasks:
1. Write a concise, compelling cover letter (3-4 short paragraphs). Address the hiring manager generically. Highlight the strongest matching skills and experiences. End with a clear call to action. Do NOT use placeholder text — write the actual letter.
2. List 3-5 specific CV tweaks the candidate should make to better match this job (e.g. "Add X to your skills section", "Reword your role at Y to emphasise Z").

Return ONLY valid JSON (no markdown):
{{
  "cover_letter": "full cover letter text here",
  "cv_tweaks": ["tweak 1", "tweak 2", "tweak 3"]
}}"""

    message = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON in Claude response")
    return json.loads(raw[start: end + 1])
