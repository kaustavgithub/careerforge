import json
import re
from typing import Any, Dict

import anthropic

from app.config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

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


def parse_cv_text(cv_text: str) -> Dict[str, Any]:
    message = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": PARSE_PROMPT + cv_text,
            }
        ],
    )
    raw = message.content[0].text
    # Extract the JSON object by finding outermost { } boundaries,
    # which handles any preamble text or markdown fences Claude may add.
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object in Claude response: {raw[:200]}")
    return json.loads(raw[start : end + 1])
