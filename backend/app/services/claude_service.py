from typing import Any, Dict

from app.services import ai_providers

PARSE_PROMPT = """You are an expert CV parser. Extract all structured information from the CV text below and return ONLY valid JSON — no markdown fences, no commentary.

Return JSON matching this exact schema (omit fields you cannot find, use null for missing optional values):
{
  "headline": "string or null",
  "summary": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin_url": "string or null",
  "github_url": "string or null",
  "website_url": "string or null",
  "work_experiences": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "is_current": false,
      "description": "string or null"
    }
  ],
  "educations": [
    {
      "institution": "string",
      "degree": "string or null",
      "field_of_study": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "grade": "string or null",
      "description": "string or null"
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "Technical | Language | Soft | Other"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string or null",
      "issue_date": "YYYY-MM-DD or null",
      "expiry_date": "YYYY-MM-DD or null",
      "url": "string or null"
    }
  ]
}

For dates: if only year is available use YYYY-01-01; if year+month use YYYY-MM-01.
Set is_current=true for roles with no end date that appear to be ongoing.

CV TEXT:
"""


def parse_cv_text(cv_text: str, user) -> Dict[str, Any]:
    return ai_providers.complete_json(PARSE_PROMPT + cv_text, user, tier="smart", max_tokens=4096)
