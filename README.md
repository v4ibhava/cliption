# Cliption 🎬⚡
> **Smart Video Cropper & Dynamic Multilingual Captions Studio**  
> 100% Offline • Hardware Auto-Detection (Small, Medium, Large Tiers) • NVIDIA GPU (CUDA + NVENC) & Low-End CPU (INT8)

Cliption is an offline creator studio (inspired by OpusClip, Clipchamp, and Submagic) that reframes horizontal videos into viral **9:16 Shorts/Reels/TikToks**, transcribes speech with word-level timestamps, styles animated karaoke captions, and translates into any language—running entirely locally without cloud subscriptions.

---

## Key Features

1. **Smart Video Cropping & Reframing**:
   - **9:16 Vertical**: YouTube Shorts, Instagram Reels, TikTok
   - **1:1 Square**: Instagram Feed, LinkedIn
   - **4:5 Portrait**: Instagram Post
   - **16:9 Landscape**: YouTube Standard
   - **Blurred Background Fit**: Places horizontal videos centered over a soft blurred copy of itself (preserves context without awkward cropping).
   - **Center Crop & Pan**: Interactive horizontal and vertical pan sliders.

2. **100% Offline AI Captions**:
   - Powered by `faster-whisper` and CTranslate2.
   - Extracts exact `start` and `end` timestamps for every single spoken word.
   - No cloud API keys or internet connection required.

3. **Hardware Auto-Detection & 3 AI Model Tiers**:
   - Inspects your machine's CPU cores, RAM, and NVIDIA GPU VRAM on startup.
   - Automatically recommends the best tier with a ⭐ badge:
     - **Small (Fast / Ultra-Light)**: Whisper `base` with INT8 CPU quantization. Uses only ~300MB RAM, instant on any low-end laptop.
     - **Medium (Balanced)**: Whisper `small` (~1GB RAM/VRAM), balanced quality and speed.
     - **Large (Max Accuracy)**: Whisper `large-v3-turbo` with NVIDIA CUDA acceleration, best for complex multilingual accents and studio quality.

4. **NVIDIA GPU Acceleration + CPU Fallback**:
   - **NVIDIA GPU Mode**: CUDA `float16` tensor inference + `h264_nvenc` fast hardware video encoding.
   - **CPU Mode**: CTranslate2 `int8` multi-threaded inference + `libx264 -preset veryfast` for smooth processing on budget machines without overheating.

5. **Viral Animated Captions (OpusClip / Submagic Style)**:
   - **Presets**: MrBeast (Bold yellow active word + black stroke), Alex Hormozi (Neon green highlight + shadow), Clean Minimal, Cyberpunk Neon.
   - **Live Synchronized Preview**: Active words light up in sync with the video timeline.
   - **Full Customization**: Font (Impact, Montserrat, Anton, Bebas Neue), size, colors, stroke, shadow, uppercase toggle, and vertical position slider.

6. **Interactive Transcript & Multilingual Translation**:
   - Double-click any word chip to fix spelling or add emojis.
   - Click any word to jump the video directly to that timecode.
   - One-click translation into Hindi, Spanish, French, German, Japanese, Chinese, Arabic, and 50+ languages while preserving karaoke timing.

---

## Quick Start (One Click)

Double-click `run.bat` in the root folder, or run:

```powershell
# In the repository root
cd backend
uv run python run.py
```

Then open your browser to [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## Architecture

- **Backend**: FastAPI, `faster-whisper` (CTranslate2 INT8/float16), `static-ffmpeg` (zero-install portable FFmpeg 8.0), `deep-translator`.
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, Vite (bundled into `frontend/dist` and directly served by FastAPI).
