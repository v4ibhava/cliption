import os
import uuid
import shutil
from pathlib import Path

# Fix PyAV metadata_errors incompatibility with newer PyAV versions
try:
    import av
    _orig_av_open = av.open
    def _safe_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _orig_av_open(*args, **kwargs)
    av.open = _safe_av_open
except Exception:
    pass

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import (
    APP_NAME, APP_VERSION, BASE_DIR,
    UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR
)
from app.models.schemas import (
    SystemSpecs,
    TranscribeRequest,
    TranslateRequest,
    RenderRequest,
    RenderTaskStatus
)
from app.services.hardware import get_system_specs
from app.services.video import get_video_info, extract_audio_wav
from app.services.stt import transcribe_audio_file
from app.services.offline_translator import translate_segments, SUPPORTED_LANGUAGES
from app.services.renderer import start_render_job, RENDER_TASKS
from app.services.setup_manager import get_full_setup_status, start_model_download

app = FastAPI(title=APP_NAME, version=APP_VERSION)

# Enable CORS for frontend Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": APP_NAME, "version": APP_VERSION}

@app.get("/api/setup/status")
def read_setup_status():
    """Check status of FFmpeg, AI model tiers, and caption packs."""
    return get_full_setup_status()

@app.post("/api/setup/download-model/{tier}")
def trigger_model_download(tier: str):
    """Trigger background download for a specific model tier."""
    try:
        return start_model_download(tier)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/system-specs", response_model=SystemSpecs)
def read_system_specs():
    """Detect local hardware (CPU, RAM, NVIDIA GPU) and recommend tier."""
    return get_system_specs()

@app.get("/api/languages")
def get_supported_languages():
    """Return dictionary of supported target languages."""
    return SUPPORTED_LANGUAGES

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for reframing and captioning."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    ext = Path(file.filename).suffix.lower()
    if ext not in [".mp4", ".mov", ".mkv", ".webm", ".avi"]:
        ext = ".mp4"

    video_id = str(uuid.uuid4())[:8]
    saved_filename = f"{video_id}{ext}"
    saved_path = UPLOAD_DIR / saved_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    info = get_video_info(str(saved_path))
    return {
        "video_id": video_id,
        "filename": file.filename,
        "width": info["width"],
        "height": info["height"],
        "duration": info["duration"],
        "aspect_ratio": info["aspect_ratio"],
        "preview_url": f"/api/media/upload/{video_id}"
    }

@app.get("/api/media/upload/{video_id}")
def stream_uploaded_video(video_id: str):
    """Stream uploaded video for browser preview."""
    # Find file with video_id in UPLOAD_DIR
    for p in UPLOAD_DIR.glob(f"{video_id}.*"):
        return FileResponse(p, media_type="video/mp4")
    raise HTTPException(status_code=404, detail="Video not found")

@app.post("/api/transcribe")
def transcribe_video(req: TranscribeRequest):
    """Transcribe audio from video using selected tier and hardware device."""
    video_path = None
    for p in UPLOAD_DIR.glob(f"{req.video_id}.*"):
        video_path = str(p)
        break

    if not video_path:
        raise HTTPException(status_code=404, detail="Video file not found")

    wav_path = str(TEMP_DIR / f"{req.video_id}.wav")
    try:
        extract_audio_wav(video_path, wav_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio extraction failed: {e}")

    try:
        segments, detected_lang = transcribe_audio_file(
            audio_path=wav_path,
            tier=req.tier,
            device=req.device,
            language=req.language
        )
        return {
            "language": detected_lang,
            "segments": [s.model_dump() for s in segments]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

@app.post("/api/translate")
def translate_transcript(req: TranslateRequest):
    """Translate subtitle segments to target language while maintaining word timing."""
    try:
        translated = translate_segments(req.segments, req.target_language)
        return {
            "target_language": req.target_language,
            "segments": [s.model_dump() for s in translated]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")

@app.post("/api/render")
def trigger_render(req: RenderRequest):
    """Start video cropping, reframing, and caption burn-in job."""
    video_path = None
    for p in UPLOAD_DIR.glob(f"{req.video_id}.*"):
        video_path = str(p)
        break

    if not video_path:
        raise HTTPException(status_code=404, detail="Video file not found")

    task_id = str(uuid.uuid4())[:8]
    start_render_job(task_id, req, video_path)

    return {
        "task_id": task_id,
        "status": "pending",
        "message": "Render job queued"
    }

@app.get("/api/status/{task_id}", response_model=RenderTaskStatus)
def get_render_status(task_id: str):
    """Poll render task progress."""
    if task_id not in RENDER_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    return RENDER_TASKS[task_id]

@app.get("/api/download/{task_id}")
def download_rendered_video(task_id: str):
    """Download the final exported video file."""
    output_path = OUTPUT_DIR / f"cliption_{task_id}.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Rendered video not found")
    return FileResponse(
        str(output_path),
        media_type="video/mp4",
        filename=f"cliption_{task_id}.mp4"
    )

# Static file serving for production build of frontend
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
