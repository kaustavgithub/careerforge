import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

JOBTECH_URL = "https://jobsearch.api.jobtechdev.se/search"
HEADERS = {"accept": "application/json"}


def _strip_html(text: str) -> str:
    """Remove HTML tags and normalise whitespace."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean)
    return clean.strip()


def _parse_hit(hit: Dict[str, Any]) -> Dict[str, Any]:
    employer = hit.get("employer") or {}
    addr = hit.get("workplace_address") or {}
    app = hit.get("application_details") or {}
    desc_obj = hit.get("description") or {}

    city = addr.get("city") or addr.get("municipality") or addr.get("region") or ""
    country = addr.get("country") or ""
    location = ", ".join(p for p in [city, country] if p) or None

    raw_desc = desc_obj.get("text") or desc_obj.get("text_formatted") or ""
    description = _strip_html(raw_desc)

    pub_raw = hit.get("publication_date")
    published_at: Optional[datetime] = None
    if pub_raw:
        try:
            published_at = datetime.fromisoformat(pub_raw.replace("Z", "+00:00"))
        except ValueError:
            pass

    return {
        "external_id": hit.get("id", ""),
        "source": "jobtech",
        "title": hit.get("headline", ""),
        "company": employer.get("name"),
        "location": location,
        "description": description,
        "apply_url": app.get("url"),
        "apply_email": app.get("email"),
        "published_at": published_at,
    }


def search_jobs(query: str, location: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    q = query
    if location:
        q = f"{query} {location}"

    params = {"q": q, "limit": min(limit, 100), "offset": 0}
    try:
        resp = requests.get(JOBTECH_URL, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        raise RuntimeError(f"JobTech API error: {exc}") from exc

    hits = data.get("hits", [])
    return [_parse_hit(h) for h in hits]
