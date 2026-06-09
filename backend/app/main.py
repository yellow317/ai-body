import os
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.foods import router as foods_router
from app.api.recommendations import router as recommendations_router
from app.core.config import settings

app = FastAPI(title="AI Health Diet", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aibody-web.pages.dev",
        "https://aibody.vercel.app",
        "https://ai-health-diet.pages.dev",
        "https://ai-health-diet.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(foods_router)
app.include_router(recommendations_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    try:
        from app.db.database import Base, engine, SessionLocal
        Base.metadata.create_all(bind=engine)

        # Handle migrations for existing databases
        from sqlalchemy import text
        with engine.connect() as conn:
            # Add avatar_url column if missing
            cols = [row[1] for row in conn.execute(text("PRAGMA table_info(user_profiles)")).fetchall()] if "sqlite" in str(engine.url) else []
            if cols and "avatar_url" not in cols:
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT"))
                conn.commit()

        # Seed foods if empty
        from app.models.food import Food
        db = SessionLocal()
        try:
            count = db.query(Food).count()
            if count == 0:
                from app.db.seed import seed
                seed(db)
                print(f"Seeded {db.query(Food).count()} foods")
            else:
                print(f"Database has {count} foods")
        finally:
            db.close()

        print("Startup complete")
    except Exception as e:
        print(f"Startup error: {e}")
        traceback.print_exc()


# Serve frontend static files (skip on Vercel, static files are served via vercel.json)
if not os.environ.get("VERCEL"):
    STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
    if STATIC_DIR.exists():
        app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

        @app.get("/{full_path:path}")
        async def serve_frontend(request: Request, full_path: str):
            file_path = STATIC_DIR / full_path
            if full_path and file_path.is_file():
                return FileResponse(str(file_path))
            return FileResponse(str(STATIC_DIR / "index.html"))
