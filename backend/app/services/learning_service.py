import re
from typing import Any, Dict, List, Optional

from app.services import ai_providers

# ---------------------------------------------------------------------------
# Local skill dictionary — (canonical_name, category, [aliases…])
# Aliases are matched as whole words (case-insensitive) in job descriptions.
# ---------------------------------------------------------------------------
_SKILLS = [
    # Languages
    ("Python",      "Language", ["python"]),
    ("JavaScript",  "Language", ["javascript", r"js\b"]),
    ("TypeScript",  "Language", ["typescript", r"ts\b"]),
    ("Java",        "Language", [r"\bjava\b"]),
    ("Go",          "Language", [r"\bgolang\b", r"\bgo\b"]),
    ("Rust",        "Language", [r"\brust\b"]),
    ("C++",         "Language", [r"c\+\+", r"\bcpp\b"]),
    ("C#",          "Language", [r"c#", r"\bcsharp\b"]),
    ("Ruby",        "Language", [r"\bruby\b"]),
    ("PHP",         "Language", [r"\bphp\b"]),
    ("Swift",       "Language", [r"\bswift\b"]),
    ("Kotlin",      "Language", [r"\bkotlin\b"]),
    ("Scala",       "Language", [r"\bscala\b"]),
    ("R",           "Language", [r"\blanguage r\b", r"\br programming\b"]),
    ("Bash",        "Language", [r"\bbash\b", r"\bshell scripting\b"]),
    ("SQL",         "Language", [r"\bsql\b"]),

    # Web frameworks / libraries
    ("React",       "Framework", [r"\breact\.?js\b", r"\breact\b"]),
    ("Vue",         "Framework", [r"\bvue\.?js\b", r"\bvue\b"]),
    ("Angular",     "Framework", [r"\bangular\b"]),
    ("Next.js",     "Framework", [r"\bnext\.?js\b"]),
    ("Svelte",      "Framework", [r"\bsvelte\b"]),
    ("Django",      "Framework", [r"\bdjango\b"]),
    ("FastAPI",     "Framework", [r"\bfastapi\b"]),
    ("Flask",       "Framework", [r"\bflask\b"]),
    ("Express",     "Framework", [r"\bexpress\.?js\b", r"\bexpress\b"]),
    ("Spring Boot", "Framework", [r"\bspring boot\b", r"\bspring\b"]),
    ("Laravel",     "Framework", [r"\blaravel\b"]),
    ("Rails",       "Framework", [r"\brails\b", r"\bruby on rails\b"]),
    ("ASP.NET",     "Framework", [r"\basp\.net\b"]),
    ("NestJS",      "Framework", [r"\bnest\.?js\b"]),
    ("GraphQL",     "Framework", [r"\bgraphql\b"]),
    ("gRPC",        "Framework", [r"\bgrpc\b"]),
    ("REST API",    "Framework", [r"\brest api\b", r"\brestful\b"]),

    # Databases
    ("PostgreSQL",  "Tool", [r"\bpostgresql\b", r"\bpostgres\b"]),
    ("MySQL",       "Tool", [r"\bmysql\b"]),
    ("MongoDB",     "Tool", [r"\bmongodb\b", r"\bmongo\b"]),
    ("Redis",       "Tool", [r"\bredis\b"]),
    ("Elasticsearch","Tool", [r"\belasticsearch\b", r"\belastic search\b"]),
    ("Cassandra",   "Tool", [r"\bcassandra\b"]),
    ("DynamoDB",    "Tool", [r"\bdynamodb\b"]),
    ("SQLite",      "Tool", [r"\bsqlite\b"]),
    ("Oracle DB",   "Tool", [r"\boracle db\b", r"\boracle database\b"]),
    ("SQL Server",  "Tool", [r"\bsql server\b", r"\bmssql\b"]),
    ("Snowflake",   "Tool", [r"\bsnowflake\b"]),
    ("BigQuery",    "Tool", [r"\bbigquery\b"]),

    # Cloud & infra
    ("AWS",         "Platform", [r"\baws\b", r"\bamazon web services\b"]),
    ("Azure",       "Platform", [r"\bazure\b", r"\bmicrosoft azure\b"]),
    ("GCP",         "Platform", [r"\bgcp\b", r"\bgoogle cloud\b"]),
    ("Kubernetes",  "Tool",     [r"\bkubernetes\b", r"\bk8s\b"]),
    ("Docker",      "Tool",     [r"\bdocker\b"]),
    ("Terraform",   "Tool",     [r"\bterraform\b"]),
    ("Ansible",     "Tool",     [r"\bansible\b"]),
    ("Helm",        "Tool",     [r"\bhelm\b"]),
    ("Linux",       "Tool",     [r"\blinux\b", r"\bunix\b"]),
    ("Nginx",       "Tool",     [r"\bnginx\b"]),

    # CI/CD
    ("GitHub Actions","Tool",   [r"\bgithub actions\b"]),
    ("Jenkins",     "Tool",     [r"\bjenkins\b"]),
    ("GitLab CI",   "Tool",     [r"\bgitlab ci\b", r"\bgitlab\b"]),
    ("CircleCI",    "Tool",     [r"\bcircleci\b"]),
    ("ArgoCD",      "Tool",     [r"\bargocd\b"]),

    # Messaging / streaming
    ("Kafka",       "Tool",     [r"\bkafka\b", r"\bapache kafka\b"]),
    ("RabbitMQ",    "Tool",     [r"\brabbitmq\b"]),
    ("Celery",      "Tool",     [r"\bcelery\b"]),
    ("Airflow",     "Tool",     [r"\bairflow\b", r"\bapache airflow\b"]),

    # Data / ML
    ("TensorFlow",  "Framework",[r"\btensorflow\b"]),
    ("PyTorch",     "Framework",[r"\bpytorch\b"]),
    ("scikit-learn","Framework",[r"\bscikit.learn\b", r"\bsklearn\b"]),
    ("Pandas",      "Framework",[r"\bpandas\b"]),
    ("NumPy",       "Framework",[r"\bnumpy\b"]),
    ("Apache Spark","Platform", [r"\bapache spark\b", r"\bspark\b"]),
    ("dbt",         "Tool",     [r"\bdbt\b"]),
    ("MLflow",      "Tool",     [r"\bmlflow\b"]),
    ("LangChain",   "Framework",[r"\blangchain\b"]),
    ("OpenAI API",  "Tool",     [r"\bopenai\b"]),

    # Observability
    ("Prometheus",  "Tool",     [r"\bprometheus\b"]),
    ("Grafana",     "Tool",     [r"\bgrafana\b"]),
    ("Datadog",     "Tool",     [r"\bdatadog\b"]),
    ("Sentry",      "Tool",     [r"\bsentry\b"]),

    # Security / auth
    ("OAuth2",      "Framework",[r"\boauth2?\b"]),
    ("JWT",         "Framework",[r"\bjwt\b"]),
    ("OIDC",        "Framework",[r"\boidc\b", r"\bopenid connect\b"]),

    # Testing
    ("Jest",        "Tool",     [r"\bjest\b"]),
    ("Pytest",      "Tool",     [r"\bpytest\b"]),
    ("Cypress",     "Tool",     [r"\bcypress\b"]),
    ("Selenium",    "Tool",     [r"\bselenium\b"]),

    # Version control / collab
    ("Git",         "Tool",     [r"\bgit\b"]),
    ("Jira",        "Tool",     [r"\bjira\b"]),
    ("Confluence",  "Tool",     [r"\bconfluence\b"]),

    # Mobile
    ("React Native","Framework",[r"\breact native\b"]),
    ("Flutter",     "Framework",[r"\bflutter\b"]),
    ("Android SDK", "Framework",[r"\bandroid sdk\b", r"\bandroid development\b"]),
    ("iOS",         "Platform", [r"\bios development\b", r"\bxcode\b"]),
]

# Precompile patterns: map canonical name → (category, compiled_regex)
_SKILL_PATTERNS: List[tuple] = []
for _name, _cat, _aliases in _SKILLS:
    _pat = re.compile("|".join(_aliases), re.IGNORECASE)
    _SKILL_PATTERNS.append((_name, _cat, _pat))


def _extract_skill_gaps_ai(jobs: List[Any], profile, user) -> List[Dict[str, Any]]:
    """AI-powered skill gap extraction using the user's configured provider (used when ai_mode='api')."""
    existing_skills = ", ".join(s.name for s in (profile.skills or []))
    combined_text = "\n\n".join(
        f"[{j.title} at {j.company} | score {j.match_score or 50}]\n{(j.description or '')[:800]}"
        for j in jobs[:15]
    )
    prompt = f"""Analyse these job listings and identify skills the candidate is missing.

CANDIDATE SKILLS: {existing_skills or 'none listed'}

JOB LISTINGS:
{combined_text}

Return ONLY valid JSON — a list of objects, sorted by importance (most-needed first):
[
  {{
    "skill": "Skill Name",
    "category": "Language|Framework|Tool|Platform",
    "frequency": <how many jobs mention it>,
    "avg_job_score": <average match score of those jobs>,
    "gap_score": <frequency * avg_job_score>,
    "jobs": [{{"id": "job_id", "title": "Job Title", "company": "Company", "score": 75}}]
  }}
]
Only include skills the candidate does NOT already have. List at most 30 skills."""

    return ai_providers.complete_json(prompt, user, tier="fast", max_tokens=3500)


def _extract_skill_gaps_local(jobs: List[Any], profile) -> List[Dict[str, Any]]:
    """Fast regex keyword scan — no API call required."""
    existing_lower = {s.name.lower() for s in (profile.skills or [])}

    job_meta = {
        str(j.id): {
            "id": str(j.id),
            "title": j.title or "",
            "company": j.company or "",
            "score": j.match_score if j.match_score is not None else 50,
        }
        for j in jobs
    }

    hits: Dict[str, Dict[str, Any]] = {}
    for j in jobs:
        desc = (j.title or "") + " " + (j.description or "")
        jid = str(j.id)
        for canonical, category, pattern in _SKILL_PATTERNS:
            if canonical.lower() in existing_lower:
                continue
            if pattern.search(desc):
                if canonical not in hits:
                    hits[canonical] = {"category": category, "jobs": {}}
                hits[canonical]["jobs"][jid] = job_meta[jid]

    result = []
    for skill, data in hits.items():
        matched_jobs = list(data["jobs"].values())
        scores = [j["score"] for j in matched_jobs]
        avg_score = int(sum(scores) / len(scores))
        frequency = len(matched_jobs)
        result.append({
            "skill": skill,
            "category": data["category"],
            "frequency": frequency,
            "avg_job_score": avg_score,
            "gap_score": frequency * avg_score,
            "jobs": sorted(matched_jobs, key=lambda x: x["score"], reverse=True),
        })

    result.sort(key=lambda x: (x["gap_score"], x["frequency"]), reverse=True)
    return result


def _merge_gaps(local: List[Dict[str, Any]], ai: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge local and AI gap lists into one unified list, deduplicating by skill name."""
    merged: Dict[str, Dict[str, Any]] = {g["skill"].lower(): dict(g) for g in local}

    for gap in ai:
        key = gap["skill"].lower()
        if key in merged:
            existing = merged[key]
            combined = {j["id"]: j for j in existing["jobs"] + gap["jobs"]}
            jobs = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
            scores = [j["score"] for j in jobs]
            existing["jobs"] = jobs
            existing["frequency"] = len(jobs)
            existing["avg_job_score"] = int(sum(scores) / len(scores))
            existing["gap_score"] = existing["frequency"] * existing["avg_job_score"]
        else:
            merged[key] = dict(gap)

    result = list(merged.values())
    result.sort(key=lambda x: (x["gap_score"], x["frequency"]), reverse=True)
    return result


def extract_skill_gaps(jobs: List[Any], profile, use_local: bool = True, user=None) -> List[Dict[str, Any]]:
    """
    Identifies missing skills from job descriptions.
    Always runs the local keyword scan first.
    When use_local=False and an AI key is configured, also runs AI extraction
    and merges both results into a single unified list so the same cards are
    visible regardless of which mode produced them.
    gap_score = frequency × avg_job_score  (higher = more important to learn)
    """
    if not jobs:
        return []

    local_result = _extract_skill_gaps_local(jobs, profile)

    if not use_local and user is not None and ai_providers.get_api_key(user):
        ai_result = _extract_skill_gaps_ai(jobs, profile, user)
        return _merge_gaps(local_result, ai_result)

    return local_result


def update_skill_gaps_from_jobs(jobs, profile, user_id, db) -> None:
    """Run local skill gap scan on given jobs and upsert results into UserSkillGap table."""
    from datetime import datetime
    from app.models.skill_gap import UserSkillGap

    if not jobs:
        return

    gaps = _extract_skill_gaps_local(jobs, profile)

    for gap in gaps:
        existing = db.query(UserSkillGap).filter(
            UserSkillGap.user_id == user_id,
            UserSkillGap.skill == gap["skill"],
        ).first()

        if existing:
            combined = {j["id"]: j for j in (existing.jobs or [])}
            for j in gap["jobs"]:
                combined[j["id"]] = j
            merged_jobs = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
            scores = [j["score"] for j in merged_jobs]
            existing.jobs = merged_jobs
            existing.frequency = len(merged_jobs)
            existing.avg_job_score = int(sum(scores) / len(scores))
            existing.gap_score = existing.frequency * existing.avg_job_score
            existing.updated_at = datetime.utcnow()
        else:
            db.add(UserSkillGap(
                user_id=user_id,
                skill=gap["skill"],
                category=gap["category"],
                frequency=gap["frequency"],
                avg_job_score=gap["avg_job_score"],
                gap_score=gap["gap_score"],
                jobs=gap["jobs"],
            ))

    db.commit()


def generate_learning_plan(skill: str, gap_jobs: List[Dict], profile, full_name: str, user) -> Dict[str, Any]:
    """Generate a structured learning plan via the user's configured AI provider (requires a valid API key)."""
    existing_skills = ", ".join(s.name for s in (profile.skills or []))
    headline = profile.headline or ""
    job_context = ", ".join(f"{j['title']} at {j['company']}" for j in gap_jobs[:5])

    prompt = f"""Create a practical learning plan for a candidate who needs to learn {skill}.

CANDIDATE:
Name: {full_name}
Headline: {headline}
Existing skills: {existing_skills or 'Not specified'}

WHY THEY NEED IT:
This skill appeared in these target jobs: {job_context}

Return ONLY valid JSON (no markdown):
{{
  "why": "2-3 sentences explaining why {skill} matters for their specific background and target roles",
  "roadmap": [
    {{
      "phase": "Phase name",
      "duration": "estimated time",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "milestone": "what you can do after completing this phase"
    }}
  ],
  "resources": [
    {{
      "name": "Resource name",
      "type": "course|book|docs|video|practice",
      "url": "URL if known, otherwise null",
      "free": true,
      "note": "one sentence on why this is recommended"
    }}
  ],
  "projects": [
    "Concrete project idea 1 that uses their existing skills",
    "Concrete project idea 2"
  ],
  "connection": "One paragraph on how {skill} builds on their existing skills like those listed above"
}}"""

    return ai_providers.complete_json(prompt, user, tier="smart", max_tokens=2000)


def build_copy_prompt(skill: str, gap_jobs: List[Dict], profile, full_name: str) -> str:
    existing_skills = ", ".join(s.name for s in (profile.skills or []))
    headline = profile.headline or "professional"
    job_titles = ", ".join(j["title"] for j in gap_jobs[:4])

    return f"""I want to learn {skill} to qualify for roles like: {job_titles}.

My background: I am a {headline} with existing skills in {existing_skills or 'various technologies'}.

Please create a structured learning plan that includes:
1. Why {skill} matters for my career goals
2. Core concepts I need to understand (beginner to job-ready)
3. Best learning resources (free and paid, with links)
4. 2-3 hands-on projects I can build to practise
5. Realistic timeline to reach job-ready level
6. How {skill} connects to my existing skills

Keep it practical and focused on what hiring managers actually test for."""
