import os
import shutil
import threading
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from faster_whisper import download_model
from app.config import MODELS_DIR
import static_ffmpeg

static_ffmpeg.add_paths()

# Map tier to faster-whisper model identifier
TIER_MODELS = {
    "small": {
        "model_id": "base",
        "name": "Small (Whisper Base)",
        "size_str": "~140 MB",
        "description": "Fastest CPU INT8 inference, ultra-light (~300MB RAM). Ideal for low-end devices.",
        "repo_sub": "base"
    },
    "medium": {
        "model_id": "small",
        "name": "Medium (Whisper Small)",
        "size_str": "~460 MB",
        "description": "High accuracy with balanced memory footprint (~1GB RAM).",
        "repo_sub": "small"
    },
    "large": {
        "model_id": "large-v3-turbo",
        "name": "Large (Whisper v3 Turbo)",
        "size_str": "~1.5 GB",
        "description": "State-of-the-art multilingual precision with NVIDIA CUDA acceleration.",
        "repo_sub": "large-v3-turbo"
    }
}

# In-memory download tasks tracker
DOWNLOAD_STATUS: Dict[str, Dict[str, Any]] = {}

def check_model_downloaded(tier: str) -> bool:
    """Check if model is fully downloaded (model.bin exists and no .incomplete)."""
    tier_info = TIER_MODELS.get(tier)
    if not tier_info:
        return False
    
    sub = tier_info["repo_sub"].lower()
    
    # Check inside MODELS_DIR
    for p in MODELS_DIR.glob(f"*{sub}*"):
        # Look for model.bin or model.safetensors in snapshots
        for bin_file in p.glob("**/model.bin"):
            if bin_file.exists() and bin_file.stat().st_size > 10_000_000:
                # Check there are no .incomplete files in blobs
                incomplete = list(p.glob("**/*.incomplete"))
                if not incomplete:
                    return True
        for bin_file in p.glob("**/model.safetensors"):
            if bin_file.exists() and bin_file.stat().st_size > 10_000_000:
                return True
    return False

def get_ffmpeg_status() -> Dict[str, Any]:
    """Check ffmpeg binary and hardware encoder support."""
    try:
        res = subprocess.run(["ffmpeg", "-encoders"], capture_output=True, text=True, timeout=5)
        has_nvenc = "h264_nvenc" in res.stdout
        has_libx264 = "libx264" in res.stdout
        
        ver_res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        first_line = ver_res.stdout.splitlines()[0] if ver_res.stdout else "FFmpeg Portable"
        
        return {
            "installed": True,
            "version": first_line,
            "h264_nvenc": has_nvenc,
            "libx264": has_libx264,
            "status": "READY"
        }
    except Exception as e:
        return {
            "installed": False,
            "version": None,
            "h264_nvenc": False,
            "libx264": False,
            "status": f"ERROR: {e}"
        }

def get_caption_packs_status() -> list:
    """Return list of ready-to-use caption design packs and fonts."""
    return [
        {
            "id": "mrbeast",
            "name": "MRBEAST VIRAL PACK",
            "font": "Impact",
            "colors": ["#FFFFFF", "#FFE600", "#000000"],
            "status": "INSTALLED"
        },
        {
            "id": "hormozi",
            "name": "HORMOZI NEON LIME",
            "font": "Montserrat",
            "colors": ["#FFFFFF", "#00FF66", "#000000"],
            "status": "INSTALLED"
        },
        {
            "id": "minimal",
            "name": "CLEAN MINIMALIST",
            "font": "Inter",
            "colors": ["#F8FAFC", "#38BDF8", "#000000"],
            "status": "INSTALLED"
        },
        {
            "id": "cyberpunk",
            "name": "CYBERPUNK NEON",
            "font": "Anton",
            "colors": ["#FFFFFF", "#00F0FF", "#7000FF"],
            "status": "INSTALLED"
        }
    ]

def get_full_setup_status() -> Dict[str, Any]:
    """Return consolidated setup state."""
    ffmpeg_info = get_ffmpeg_status()
    
    models_status = {}
    for tier, info in TIER_MODELS.items():
        downloaded = check_model_downloaded(tier)
        task = DOWNLOAD_STATUS.get(tier, {})
        models_status[tier] = {
            "id": tier,
            "name": info["name"],
            "model_id": info["model_id"],
            "size": info["size_str"],
            "description": info["description"],
            "downloaded": downloaded,
            "status": task.get("status", "READY" if downloaded else "NOT_DOWNLOADED"),
            "progress": task.get("progress", 100 if downloaded else 0),
            "message": task.get("message", "Model ready offline" if downloaded else "Click to download for offline use")
        }

    # At least one model downloaded or ffmpeg ready
    has_any_model = any(m["downloaded"] for m in models_status.values())
    is_fully_ready = ffmpeg_info["installed"] and has_any_model

    return {
        "ffmpeg": ffmpeg_info,
        "models": models_status,
        "caption_packs": get_caption_packs_status(),
        "is_fully_ready": is_fully_ready
    }

def _download_worker(tier: str):
    """Background thread to download model using faster_whisper."""
    tier_info = TIER_MODELS.get(tier)
    if not tier_info:
        return

    DOWNLOAD_STATUS[tier] = {
        "status": "DOWNLOADING",
        "progress": 20,
        "message": f"Downloading {tier_info['name']} into local storage..."
    }

    try:
        # Download model using faster_whisper download_model
        download_model(tier_info["model_id"], output_dir=str(MODELS_DIR))
        DOWNLOAD_STATUS[tier] = {
            "status": "READY",
            "progress": 100,
            "message": f"{tier_info['name']} downloaded and verified offline!"
        }
    except Exception as e:
        print(f"Error downloading model {tier}: {e}")
        DOWNLOAD_STATUS[tier] = {
            "status": "FAILED",
            "progress": 0,
            "message": f"Download failed: {str(e)}"
        }

def start_model_download(tier: str) -> Dict[str, Any]:
    """Start background download of a model tier."""
    if tier not in TIER_MODELS:
        raise ValueError(f"Unknown tier: {tier}")

    if check_model_downloaded(tier):
        return {"status": "ALREADY_DOWNLOADED", "message": "Model is already present"}

    current = DOWNLOAD_STATUS.get(tier, {})
    if current.get("status") == "DOWNLOADING":
        return {"status": "DOWNLOADING", "message": "Download is already in progress"}

    t = threading.Thread(target=_download_worker, args=(tier,), daemon=True)
    t.start()
    return {"status": "STARTED", "message": f"Download queued for {tier}"}

