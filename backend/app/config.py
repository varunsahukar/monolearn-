from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    PROJECT_NAME: str = "FastAPI Scaffold"
    ENVIRONMENT: Literal["dev", "prod", "test"] = "dev"
    SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    
    # Redis & Celery
    REDIS_URL: str
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # AI
    OPENAI_API_KEY: str

settings = Settings()
