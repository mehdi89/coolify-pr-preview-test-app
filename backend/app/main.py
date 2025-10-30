from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from datetime import datetime

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


@app.get("/api/environment", tags=["Environment"])
def get_environment():
    """
    Get current environment information
    Useful for validating PR preview deployments in Coolify
    """
    pr_number = os.getenv("PR_NUMBER", None)
    environment = os.getenv("ENVIRONMENT", "development")

    # Determine environment type
    if pr_number:
        env_type = "preview"
        env_name = f"PR #{pr_number}"
    elif environment == "production":
        env_type = "production"
        env_name = "Production"
    else:
        env_type = "development"
        env_name = "Development"

    return {
        "environment": {
            "type": env_type,
            "name": env_name,
            "pr_number": pr_number
        },
        "deployment": {
            "timestamp": datetime.utcnow().isoformat(),
            "api_url": os.getenv("API_URL", "http://localhost:8000"),
            "frontend_url": os.getenv("FRONTEND_URL", "http://localhost:3000")
        },
        "database": {
            "host": os.getenv("DATABASE_HOST", "postgres"),
            "name": os.getenv("DATABASE_NAME", "testdb")
        },
        "test_change": "PR Preview Validation - This confirms the preview deployment is working!"
    }
