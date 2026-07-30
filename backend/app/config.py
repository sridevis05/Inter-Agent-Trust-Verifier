import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelTrust AI"
    API_VERSION: str = "v1"
    
    # Database
    # Use SQLite by default for easy development, but configure Postgres url for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentineltrust.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # RabbitMQ
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
    
    # Cryptographic keys
    # AES key must be 32 bytes (256 bits) for AES-256. We'll default to a fixed one for testing if not provided.
    AES_SECRET_KEY: str = os.getenv("AES_SECRET_KEY", "sentineltrust_secret_key_32_bytes_!")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "sentineltrust_jwt_secret_token_key_here")
    JWT_ALGORITHM: str = "HS256"
    
    # Secrets Manager Configuration (HashiCorp Vault / AWS Secrets Manager)
    SECRETS_PROVIDER: str = os.getenv("SECRETS_PROVIDER", "local")  # local, vault, aws
    VAULT_ADDR: Optional[str] = os.getenv("VAULT_ADDR", None)
    VAULT_TOKEN: Optional[str] = os.getenv("VAULT_TOKEN", None)
    
    # Mock LLM API Key (Can be set to actual Gemini/OpenAI key)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    
    # Global Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    class Config:
        case_sensitive = True

settings = Settings()
