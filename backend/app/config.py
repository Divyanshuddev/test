from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
# Database connection string
database_url: str

```
# CORS origins
# Examples:
# CORS_ORIGINS=*
# CORS_ORIGINS=https://your-app.vercel.app
# CORS_ORIGINS=https://app1.vercel.app,https://app2.vercel.app
cors_origins: str = "*"

model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    extra="ignore",
)
```

settings = Settings()
