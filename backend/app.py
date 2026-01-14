from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import routers
from Feature1.crisis_dispatch import router as crisis_router

# Create FastAPI app
app = FastAPI(
    title="CrisisNet Dispatch API",
    description="AI-Powered Crisis Response & Coordination System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(crisis_router)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "🚨 CrisisNet Dispatch API",
        "status": "operational",
        "version": "1.0.0",
        "endpoints": {
            "crisis": "/crisis",
            "docs": "/docs",
            "websocket": "/crisis/ws/dashboard"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2024-01-15T10:00:00Z",
        "service": "crisis-dispatch"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    print("CrisisNet Dispatch API starting up...")
    print("WebSocket endpoints active:")
    print("   - /crisis/ws/dashboard (Dashboard updates)")
    print("   - /crisis/ws/agency/{agency_id} (Agency connections)")
    print("")
    print("REST API available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )