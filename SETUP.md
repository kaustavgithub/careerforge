# CareerForge — Local Development Setup

For running with Docker Compose, see [README.md](README.md).

This guide covers running backend and frontend separately with hot reload — useful when actively developing.

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16 running locally (or via Docker)

---

## 1. Database

Quickest option — spin up Postgres in Docker:

```bash
docker run -d --name careerforge-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=careerportal \
  -p 5432:5432 \
  postgres:16
```

Or create a local database:

```sql
CREATE DATABASE careerportal;
```

---

## 2. Backend

```bash
cd backend

python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/careerportal
JWT_SECRET=dev-secret-change-in-production
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173

# Optional Authentik SSO
# AUTHENTIK_URL=https://auth.example.com
# AUTHENTIK_CLIENT_ID=
# AUTHENTIK_CLIENT_SECRET=
# AUTHENTIK_REDIRECT_URI=http://localhost:8000/auth/oidc/callback
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Generate a JWT secret

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

App: http://localhost:5173

---

## 4. Project structure

```
careerforge/
├── backend/
│   ├── alembic/            # Database migrations
│   │   └── versions/
│   ├── app/
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routers/        # FastAPI route handlers
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic (Claude, JobTech, CV parsing)
│   │   ├── config.py       # Settings from env vars
│   │   ├── database.py     # DB session setup
│   │   ├── dependencies.py # JWT auth dependency
│   │   └── main.py         # FastAPI app + CORS
│   ├── Dockerfile
│   ├── entrypoint.sh       # Runs migrations then starts uvicorn
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client with JWT interceptor
│   │   ├── components/     # Shared + feature components
│   │   │   ├── jobs/       # JobCard, GenerateModal, TrackerPanel
│   │   │   └── profile/    # ProfileView and section editors
│   │   ├── context/        # AuthContext (JWT storage)
│   │   └── pages/          # Route-level page components
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register with email + password |
| POST | `/auth/login` | — | Login, receive JWT |
| GET | `/auth/oidc/available` | — | Whether Authentik SSO is configured |
| GET | `/auth/oidc/login` | — | Start Authentik OIDC flow |
| GET | `/auth/oidc/callback` | — | OIDC callback handler |
| GET | `/profile` | JWT | Get own profile |
| PUT | `/profile` | JWT | Update profile |
| POST | `/profile/photo` | JWT | Upload profile photo |
| GET | `/profile/public/:id` | — | Public recruiter profile |
| POST | `/cv/parse` | JWT | Upload CV → Claude parse |
| GET | `/cv/generate?format=pdf` | JWT | Download CV as PDF |
| GET | `/cv/generate?format=docx` | JWT | Download CV as DOCX |
| POST | `/jobs/search` | JWT | Fetch + AI-score jobs from JobTech |
| GET | `/jobs` | JWT | List all tracked jobs |
| POST | `/jobs/:id/generate` | JWT | Generate cover letter + CV tweaks |
| PATCH | `/jobs/:id/status` | JWT | Update application status |
| DELETE | `/jobs/:id` | JWT | Remove a job |

---

## 6. Database migrations

Migrations live in `backend/alembic/versions/`. When you change a model, create a new migration:

```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

In Docker Compose, `entrypoint.sh` runs `alembic upgrade head` automatically on every container start.
