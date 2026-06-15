from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, cv, jobs, learning, profile, settings

app = FastAPI(title="Career Profile Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Browser extension origin can't be whitelisted by ID
    allow_credentials=False,   # JWT is in Authorization header, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(cv.router)
app.include_router(jobs.router)
app.include_router(learning.router)
app.include_router(settings.router)


@app.get("/health")
def health():
    return {"status": "ok"}
