import os
import json
import subprocess
from pathlib import Path
from typing import Dict, Any, Tuple
import static_ffmpeg

static_ffmpeg.add_paths()

def get_video_info(video_path: str) -> Dict[str, Any]:
    """Extract video dimensions, duration, and framerate using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "stream=width,height,r_frame_rate,duration,codec_name",
        "-show_entries", "format=duration,size,bit_rate",
        "-of", "json",
        video_path
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        
        video_stream = None
        for s in data.get("streams", []):
            if s.get("width") and s.get("height"):
                video_stream = s
                break
                
        width = int(video_stream.get("width", 1920)) if video_stream else 1920
        height = int(video_stream.get("height", 1080)) if video_stream else 1080
        
        duration = 0.0
        if video_stream and video_stream.get("duration"):
            duration = float(video_stream["duration"])
        elif data.get("format", {}).get("duration"):
            duration = float(data["format"]["duration"])
            
        return {
            "width": width,
            "height": height,
            "duration": round(duration, 2),
            "aspect_ratio": round(width / max(1, height), 3),
            "codec": video_stream.get("codec_name", "h264") if video_stream else "h264"
        }
    except Exception as e:
        print(f"Error probing video {video_path}: {e}")
        return {
            "width": 1920,
            "height": 1080,
            "duration": 0.0,
            "aspect_ratio": 1.777,
            "codec": "h264"
        }

def extract_audio_wav(video_path: str, output_wav_path: str) -> str:
    """Extract clean 16kHz 16-bit mono WAV for Whisper."""
    cmd = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_wav_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    return output_wav_path

def get_target_dimensions(aspect_ratio: str, quality: str = "1080p") -> Tuple[int, int]:
    """Return target (width, height) based on aspect ratio and quality preset."""
    if quality == "720p":
        if aspect_ratio == "9:16":
            return (720, 1280)
        elif aspect_ratio == "1:1":
            return (720, 720)
        elif aspect_ratio == "4:5":
            return (720, 900)
        else: # 16:9
            return (1280, 720)
    else: # 1080p standard
        if aspect_ratio == "9:16":
            return (1080, 1920)
        elif aspect_ratio == "1:1":
            return (1080, 1080)
        elif aspect_ratio == "4:5":
            return (1080, 1350)
        else: # 16:9
            return (1920, 1080)

def get_motion_blur_filter(intensity: float = 0.80) -> str:
    """
    Simulates RSMB (ReelSmart Motion Blur) via Motion-Adaptive Masked Directional Smear:
    1. Computes temporal motion difference mask (tblend=difference + colorlevels).
    2. Any pixel with 0 movement (faces, text, background) has mask=0 (100% crystal sharp).
    3. Fast-moving pixels (camera pan, action) receive directional shutter smear (dblur).
    4. Merges via maskedmerge so motion is smeared along the pan without duplicate ghost outlines.
    """
    try:
        val = float(intensity) if intensity is not None else 0.80
    except (ValueError, TypeError):
        val = 0.80

    # Handle legacy percentage (e.g. 50 -> 0.80)
    if val > 2.5:
        val = val / 100.0

    val = max(0.20, min(2.0, val))
    radius = max(2, min(14, int(round(val * 6.0))))

    return (
        f"[0:v]split=3[mb_main][mb_blur_in][mb_diff_in];"
        f"[mb_blur_in]dblur=angle=0:radius={radius}[mb_blurred];"
        f"[mb_diff_in]tblend=all_mode=difference,format=gray,colorlevels=rimin=0.06:rimax=0.25[mb_mask];"
        f"[mb_main][mb_blurred][mb_mask]maskedmerge[src_v];"
    )

def build_filter_complex(
    target_w: int,
    target_h: int,
    fit_mode: str,
    subtitles_filename: str,
    pan_x: float = 0.5,
    pan_y: float = 0.5,
    zoom: float = 3.16,
    blur_intensity: int = 25,
    motion_blur: bool = False,
    motion_blur_intensity: int = 50
) -> str:
    """
    Build FFmpeg filtergraph for cropping/reframing, optional motion blur, and burning in subtitles.
    subtitles_filename is a relative filename loaded in cwd (e.g. 'subtitles_xyz.ass')
    which avoids all Windows drive letter colon and backslash escaping issues in libass.
    """
    clean_sub_name = Path(subtitles_filename).name

    # Handle motion blur preprocessing if enabled
    if motion_blur and (motion_blur_intensity is None or motion_blur_intensity > 0):
        mb_prefix = get_motion_blur_filter(motion_blur_intensity or 0.80)
        src_label = "src_v"
    else:
        mb_prefix = ""
        src_label = "0:v"

    # Unified zoom & pan calculation across all modes
    # zoom scale: 1.0 (full scene / uncropped width) to 3.5 (full vertical cover)
    z = max(1.0, min(3.5, zoom if zoom is not None else (3.16 if fit_mode == "crop" else 1.0)))
    scaled_w = int(target_w * z)
    if scaled_w % 2 != 0:
        scaled_w += 1

    fg_pipeline = (
        f"scale={scaled_w}:-2,"
        f"crop=w=min(iw\\,{target_w}):h=min(ih\\,{target_h}):x=max(0\\,(iw-{target_w})*{pan_x}):y=max(0\\,(ih-{target_h})*{pan_y})"
    )

    if fit_mode == "blur_background":
        # Ultra-fast background blur: downscale background to 360x640, blur, then upscale
        # This provides a 5x-10x rendering speedup while looking identical to full-res blur
        b_radius = max(3, blur_intensity // 3)
        filter_str = (
            f"{mb_prefix}"
            f"[{src_label}]split=2[orig][bg];"
            f"[bg]scale=360:640:force_original_aspect_ratio=increase,"
            f"crop=360:640,boxblur={b_radius}:2,scale={target_w}:{target_h}[bgblur];"
            f"[orig]{fg_pipeline}[fg];"
            f"[bgblur][fg]overlay=(W-w)/2:(H-h)/2[composed];"
            f"[composed]ass={clean_sub_name}[outv]"
        )
    else:
        # Clean solid black borders (letterbox/pillarbox) when uncropped, or full cover when zoomed
        filter_str = (
            f"{mb_prefix}"
            f"[{src_label}]{fg_pipeline},"
            f"pad={target_w}:{target_h}:max(0\\,({target_w}-iw)/2):max(0\\,({target_h}-ih)/2):black[cropped];"
            f"[cropped]ass={clean_sub_name}[outv]"
        )
    
    return filter_str
