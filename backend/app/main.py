from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.routers import auth, todos
from app.schemas import HealthCheck

# Create FastAPI app
app = FastAPI(
    title="Coolify Test App - Backend",
    description="FastAPI backend for testing Coolify preview environments",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(todos.router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint"""
    return {
        "message": "Coolify Test App API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint - tests database connection"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "message": "API is running"
    }


@app.get("/api/test", tags=["Test"])
def test_endpoint():
    """Test endpoint for Coolify connectivity"""
    return {
        "message": "Backend API is reachable",
        "service": "backend",
        "status": "ok"
    }
