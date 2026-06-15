import json
from typing import Any, Dict, List, Optional

import anthropic

def _get_client(api_key: str) -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=api_key)


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


def score_job_locally(job: Dict[str, Any], profile) -> tuple:
    """
    Pure-Python keyword scoring — no API call required.
    Returns (score: int 0-100, summary: str).

    Weights:
      - Skill keyword hits in job text : up to 60 pts
      - Job-title words in job title   : up to 30 pts
      - Location match                 : up to 10 pts
    """
    skill_keywords = {s.name.lower() for s in (profile.skills or [])}

    title_keywords: set = set()
    for exp in (profile.work_experiences or []):
        for word in (exp.title or "").lower().split():
            if len(word) > 3:
                title_keywords.add(word)

    job_title = (job.get("title") or "").lower()
    full_text = f"{job_title} {(job.get('description') or '').lower()}"

    if not skill_keywords and not title_keywords:
        return 50, "Complete your profile to get accurate match scores"

    skill_hits = [kw for kw in skill_keywords if kw in full_text]
    skill_score = (len(skill_hits) / max(len(skill_keywords), 1)) * 60

    title_hits = [kw for kw in title_keywords if kw in job_title]
    title_score = min(30, len(title_hits) * 10)

    location_score = 0
    if profile.location:
        prof_loc = profile.location.lower()
        job_loc = (job.get("location") or "").lower()
        if prof_loc and job_loc and (prof_loc in job_loc or job_loc in prof_loc):
            location_score = 10

    total = min(100, int(skill_score + title_score + location_score))

    n = len(skill_hits)
    if total >= 80:
        summary = f"Strong match — {n} of your skills align with this role"
    elif total >= 60:
        summary = f"Good match — {n} skills found, minor gaps"
    elif total >= 40:
        summary = f"Partial match — {n} skills found"
    else:
        summary = f"Weak match — only {n} profile keywords found in this listing"

    return total, summary


def batch_score_jobs(jobs: List[Dict[str, Any]], profile, full_name: str) -> List[Dict[str, Any]]:
    """Score a list of jobs locally (no API). Returns [{id, score, summary}]."""
    results = []
    for job in jobs:
        score, summary = score_job_locally(job, profile)
        results.append({"id": job["external_id"], "score": score, "summary": summary})
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def generate_tailored_cv_data(job: Dict[str, Any], profile, full_name: str, api_key: str = "") -> Dict[str, Any]:
    """
    Ask Claude Sonnet to rewrite the candidate's CV content to maximise ATS
    score for this specific job. Returns a dict with tailored headline,
    summary, experiences (rewritten bullets) and skill_groups (reordered).
    Dates / companies / titles are never changed — only descriptions & summary.
    """
    profile_text = _build_profile_summary(profile, full_name)
    desc = (job.get("description") or "")[:4000]

    experiences_json = json.dumps([
        {"title": e.title, "company": e.company, "description": e.description or ""}
        for e in (profile.work_experiences or [])
    ], ensure_ascii=False)

    prompt = f"""You are an expert ATS optimisation specialist. Rewrite the candidate's CV content to maximise the ATS match score for the target role.

CANDIDATE PROFILE:
{profile_text}

ORIGINAL EXPERIENCE (title / company are fixed — only rewrite description):
{experiences_json}

TARGET JOB:
Title: {job.get('title', '')}
Company: {job.get('company', '')}
Description:
{desc}

RULES:
- Only use skills and experience the candidate genuinely has — never invent anything
- Mirror the exact keywords and phrases from the job description naturally
- Rewrite each experience description as concise action-verb bullet points (one per line, no bullet symbols)
- Reorder skill_groups: most relevant category first, most relevant skills first within each category
- Headline must echo the job title language
- Summary: 3-4 sentences, ATS-dense, first-person, no fluff

Return ONLY valid JSON (no markdown fences):
{{
  "headline": "tailored headline",
  "summary": "ATS-optimised summary paragraph",
  "experiences": [
    {{
      "title": "exact original title",
      "company": "exact original company",
      "description": "rewritten bullet 1\\nrewritten bullet 2\\nrewritten bullet 3"
    }}
  ],
  "skill_groups": [
    {{ "category": "Category Name", "names": ["skill1", "skill2"] }}
  ]
}}"""

    message = _get_client(api_key).messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON in Claude response for tailored CV")
    return json.loads(raw[start: end + 1])


def generate_cover_letter_and_tweaks(job: Dict[str, Any], profile, full_name: str, api_key: str = "") -> Dict[str, Any]:
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

    message = _get_client(api_key).messages.create(
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
