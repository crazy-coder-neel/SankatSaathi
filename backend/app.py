from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# Vercel Compatibility: Add the current directory to sys.path
# This handles cases where Vercel runs the script from the root or the backend folder.
current_dir = Path(__file__).parent.resolve()
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

# Import routers
try:
    from Feature1.crisis_dispatch import router as crisis_router
except ImportError:
    # If standard import fails, try relative or absolute from backend
    from backend.Feature1.crisis_dispatch import router as crisis_router

# Create FastAPI app
app = FastAPI(
    title="SankatSaathi API",
    version="1.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTING ---
# We use a single inclusion to avoid route collisions.
# The external Vercel routing (vercel.json) handles the /api prefix.
# However, for local dev consistency, we can include it with prefix as well.
app.include_router(crisis_router, prefix="/api")
app.include_router(crisis_router) # Fallback if /api is stripped by proxy

@app.get("/")
@app.get("/api")
async def root(request: Request):
    return {
        "message": "🚨 SankatSaathi API is Live",
        "status": "operational",
        "env": "production" if os.getenv("VERCEL") else "local",
        "path": request.url.path
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}