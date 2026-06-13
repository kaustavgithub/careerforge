# CareerForge

An AI-powered job application portal. Upload your CV, let Claude parse it into a structured profile, search live Swedish job listings via the JobTech API, get AI match scores, and generate tailored cover letters — all in one self-hosted tool.

## Features

- **Smart CV import** — upload a PDF/DOCX and Claude extracts your work history, education, skills, and certifications automatically
- **Profile editor** — edit every section directly, or paste Claude-parsed JSON from a local chat session
- **Public profile link** — shareable URL (`/u/:id`) for recruiters, no login required
- **AI job matching** — searches the free [JobTech Dev API](https://jobsearch.api.jobtechdev.se) (Swedish listings), then scores each result 0–100 against your profile using Claude Haiku
- **Cover letter generation** — one click generates a tailored cover letter + CV tweak suggestions using Claude Sonnet
- **Application tracker** — track jobs as Saved / Applied / Rejected, with timestamps
- **Authentik SSO** — optional OIDC login alongside the built-in email/password auth
- **Glassmorphism UI** — dark theme with scroll-reveal animations on the profile page

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL 16 |
| AI | Anthropic Claude (Haiku for scoring, Sonnet for cover letters & CV parsing) |
| Jobs API | [JobTech Dev](https://jobsearch.api.jobtechdev.se) (free, no auth) |
| Auth | JWT (built-in) + Authentik OIDC (optional) |
| Deploy | Docker Compose |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- An [Anthropic API key](https://platform.anthropic.com)

### 1. Clone and configure

```bash
git clone https://github.com/your-username/careerforge.git
cd careerforge

cp .env.example .env
```

Edit `.env` — at minimum set `ANTHROPIC_API_KEY`:

```env
ANTHROPIC_API_KEY=sk-ant-...
DB_PASSWORD=a-strong-password
JWT_SECRET=run-python3-c-import-secrets-print-secrets-token-hex-32
```

### 2. Start

```bash
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API + Swagger: http://localhost:8000/docs

All database migrations run automatically on startup. Data is persisted in a named Docker volume (`postgres_data`) — a plain `docker compose down` is safe. Only `docker compose down -v` removes data.

### 3. First use

1. Open http://localhost:3000 and register an account
2. Upload your CV (PDF or DOCX) — Claude parses it in seconds
3. Review and edit your profile
4. Go to **Jobs**, search for a role, and explore AI-ranked matches

## Authentik SSO (optional)

If you run [Authentik](https://goauthentik.io), you can add SSO login alongside the email/password form.

**In Authentik:**

1. Create an **OAuth2/OpenID Provider**
   - Client type: Confidential
   - Redirect URI: `http://localhost:8000/auth/oidc/callback`
   - Scopes: `openid`, `email`, `profile`
2. Create an **Application** linked to that provider
3. Copy the Client ID and Client Secret

**In `.env`:**

```env
AUTHENTIK_URL=https://auth.example.com
AUTHENTIK_CLIENT_ID=<client id>
AUTHENTIK_CLIENT_SECRET=<client secret>
AUTHENTIK_REDIRECT_URI=http://localhost:8000/auth/oidc/callback
```

Then restart the backend (`docker compose up -d`). A "Continue with Authentik" button will appear on the login page automatically. SSO users are created in the database on first login with no password set.

## Database backups

```bash
# Backup
docker compose exec db pg_dump -U postgres careerportal > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U postgres careerportal < backup_20260613.sql
```

## API reference

Full interactive docs available at http://localhost:8000/docs when running.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register with email + password |
| POST | `/auth/login` | — | Login, receive JWT |
| GET | `/auth/oidc/login` | — | Start Authentik SSO flow |
| GET | `/auth/oidc/callback` | — | OIDC callback (Authentik → backend) |
| GET | `/profile` | JWT | Get own profile |
| PUT | `/profile` | JWT | Update profile |
| GET | `/profile/public/:id` | — | Public profile (recruiter link) |
| POST | `/cv/parse` | JWT | Upload CV → Claude parsing |
| GET | `/cv/generate` | JWT | Download CV as PDF or DOCX |
| POST | `/jobs/search` | JWT | Search + AI-rank jobs |
| GET | `/jobs` | JWT | List tracked jobs |
| POST | `/jobs/:id/generate` | JWT | Generate cover letter + CV tweaks |
| PATCH | `/jobs/:id/status` | JWT | Update application status |
| DELETE | `/jobs/:id` | JWT | Remove a job |

## Environment variables

### Root `.env` (used by Docker Compose)

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `DB_PASSWORD` | No | Postgres password (default: `password`) |
| `JWT_SECRET` | No | Secret for signing JWTs — change in production |
| `JWT_EXPIRE_MINUTES` | No | Token lifetime in minutes (default: `10080` = 7 days) |
| `AUTHENTIK_URL` | No | Base URL of your Authentik instance |
| `AUTHENTIK_CLIENT_ID` | No | OAuth2 client ID from Authentik |
| `AUTHENTIK_CLIENT_SECRET` | No | OAuth2 client secret from Authentik |
| `AUTHENTIK_REDIRECT_URI` | No | Must match Authentik config (default: `http://localhost:8000/auth/oidc/callback`) |

## Development (without Docker)

See [SETUP.md](SETUP.md) for running backend and frontend separately with hot reload.

## License

MIT
