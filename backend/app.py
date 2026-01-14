from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# Add the backend directory to sys.path to ensure imports work in Vercel
# We use parent of app.py (which is backend/)
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import routers
from Feature1.crisis_dispatch import router as crisis_router

# Create FastAPI app
app = FastAPI(
    title="CrisisNet Dispatch API",
    description="AI-Powered Crisis Response & Coordination System",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTING FIX ---
# To handle local (/api/...) and Vercel variations, we include the router twice.
# 1. For local and Vercel (if paths are absolute from root)
app.include_router(crisis_router, prefix="/api")
# 2. Fallback (if Vercel or proxy strips the /api prefix)
app.include_router(crisis_router)

# Health & Debug Endpoints
@app.get("/")
@app.get("/api")
async def root(request: Request):
    return {
        "message": "🚨 CrisisNet Dispatch API",
        "status": "operational",
        "path_received": request.url.path,
        "endpoints": {
            "crisis": "/api/crisis",
            "test_sms": "/api/crisis/test-sms",
            "debug": "/api/debug"
        }
    }

@app.get("/api/debug")
async def debug_info(request: Request):
    return {
        "path": request.url.path,
        "method": request.method,
        "env_keys": {
            "SUPABASE": bool(os.getenv("SUPABASE_URL")),
            "TWILIO": bool(os.getenv("TWILIO_ACCOUNT_SID")),
            "GOOGLE": bool(os.getenv("GEMINI_API_KEY"))
        },
        "sys_path": sys.path[:5]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)