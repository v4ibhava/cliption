import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent
STORAGE_DIR = WORKSPACE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
OUTPUT_DIR = STORAGE_DIR / "outputs"
TEMP_DIR = STORAGE_DIR / "temp"
MODELS_DIR = STORAGE_DIR / "models"

for directory in [STORAGE_DIR, UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR, MODELS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# App Settings
APP_NAME = "Cliption"
APP_VERSION = "0.1.0"
HOST = "127.0.0.1"
PORT = 8000
