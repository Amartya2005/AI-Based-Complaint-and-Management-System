from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str

    JWT_SECRET_KEY: str = Field(
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY")
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        validation_alias=AliasChoices("JWT_ALGORITHM", "ALGORITHM"),
    )
    JWT_EXPIRY_MINUTES: int = Field(
        default=60,
        validation_alias=AliasChoices(
            "JWT_EXPIRY_MINUTES",
            "ACCESS_TOKEN_EXPIRE_MINUTES",
        ),
    )

    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Support comma-separated string from .env or shell (e.g. 'https://a.com,https://b.com')."""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, (list, tuple)):
            return list(v)
        return v

    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_COMPLAINT_CREATE: str = "20/minute"

    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TTL_SECONDS: int = 300
    REDIS_JWT_BLACKLIST_TTL: int = 3600

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Complaint Management System"
    SMTP_FROM_EMAIL: str = ""
    NOTIFICATIONS_ENABLED: bool = True
    EMAIL_ENABLED: bool = True  # separate control for email attempts (in addition to NOTIFICATIONS_ENABLED)

    ML_MODEL_PATH: str = "app/ml/models/classifier.joblib"
    ML_MIN_TRAINING_SAMPLES: int = 50
    ML_CONFIDENCE_THRESHOLD: float = 0.6

    UPLOAD_DIR: str = "./uploads"

    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False

    @field_validator("JWT_SECRET_KEY", mode="after")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        bad_defaults = {
            "your-secret-key",
            "change-this-to-a-long-random-secret-key-in-production",
        }
        if v in bad_defaults or len(v) < 32:
            raise ValueError(
                "Set a strong SECRET_KEY in .env (minimum 32 characters). "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()
