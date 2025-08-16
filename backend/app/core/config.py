from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",  # Ignore unknown env vars like OTEL_SDK_DISABLED
    )
    # Database
    DATABASE_URL: str = "sqlite:///./crewui.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "http://192.168.1.24:3000",
        "http://surface.local:3000",
        "*"  # Allow all origins in development
    ]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
settings = Settings() 