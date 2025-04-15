from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    spotipy_client_id: str
    spotipy_client_secret: str
    spotipy_redirect_uri: str

    class Config:
        env_file = ".env"

settings = Settings()
