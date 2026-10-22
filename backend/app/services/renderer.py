import os
import re
import time
import threading
import subprocess
from typing import Dict
from app.config import OUTPUT_DIR, TEMP_DIR
from app.models.schemas import RenderRequest, RenderTaskStatus
from app.services.video import (
    get_video_info,
    get_target_dimensions,
    build_filter_complex
)
from app.services.subtitles import generate_ass_subtitles
import static_ffmpeg

static_ffmpeg.add_paths()

# In-memory store for task progress
RENDER_TASKS: Dict[str, RenderTaskStatus] = {}

def update_task(task_id: str, **kwargs):
    if task_id in RENDER_TASKS:
        for k, v in kwargs.items():
            setattr(RENDER_TASKS[task_id], k, v)

def run_render_pipeline(task_id: str, req: RenderRequest, input_video_path: str):
    """Executes FFmpeg rendering job in background with deadlock-free progress tracking."""
    try:
        update_task(task_id, status="processing", progress=5, message="Analyzing video streams...")
        video_info = get_video_info(input_video_path)
        total_duration = max(1.0, video_info.get("duration", 10.0))

        # Target dimensions
        target_w, target_h = get_target_dimensions(req.crop.aspect_ratio, req.quality)

        # 1. Generate ASS Subtitles
        update_task(task_id, progress=15, message="Generating dynamic animated subtitles...")
        ass_filename = f"subtitles_{task_id}.ass"
        ass_path = str(TEMP_DIR / ass_filename)
        generate_ass_subtitles(
            segments=req.segments,
            style=req.style,
            output_path=ass_path,
            video_width=target_w,
            video_height=target_h
        )

        # 2. Build Filter Complex
        filter_str = build_filter_complex(
            target_w=target_w,
            target_h=target_h,
            fit_mode=req.crop.fit_mode,
            subtitles_filename=ass_filename,
            pan_x=req.crop.pan_x,
            pan_y=req.crop.pan_y,
            zoom=req.crop.zoom,
            blur_intensity=req.crop.blur_intensity,
            motion_blur=getattr(req.crop, "motion_blur", False),
            motion_blur_intensity=getattr(req.crop, "motion_blur_intensity", 50)
        )

        # 3. Output & Diagnostic Files
        output_filename = f"cliption_{task_id}.mp4"
        output_path = str(OUTPUT_DIR / output_filename)
        progress_path = str(TEMP_DIR / f"prog_{task_id}.txt")
        log_path = str(TEMP_DIR / f"ffmpeg_{task_id}.log")

        # 4. Choose Video Encoder (NVIDIA NVENC vs CPU libx264)
        encoder_args = []
        if req.use_gpu:
            update_task(task_id, progress=25, message="Encoding with NVIDIA NVENC GPU acceleration...")
            encoder_args = [
                "-c:v", "h264_nvenc",
                "-preset", "p2",
                "-rc", "vbr",
                "-cq", "23"
            ]
        else:
            update_task(task_id, progress=25, message="Encoding with CPU (libx264 veryfast)...")
            encoder_args = [
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-threads", "auto"
            ]

        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_video_path,
            "-filter_complex", filter_str,
            "-map", "[outv]",
            "-map", "0:a?",
            *encoder_args,
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            "-progress", progress_path,
            output_path
        ]

        # Launch FFmpeg writing stdout and stderr directly to a log file
        # to prevent OS pipe buffer deadlocks on long videos
        time_us_pattern = re.compile(r"out_time_us=(\d+)")
        time_str_pattern = re.compile(r"out_time=(\d+):(\d+):(\d+\.?\d*)")

        with open(log_path, "w", encoding="utf-8", errors="ignore") as log_file:
            proc = subprocess.Popen(
                cmd,
                stdout=log_file,
                stderr=log_file,
                cwd=str(TEMP_DIR),
                universal_newlines=True
            )

            # Monitor progress non-blocking from progress_path
            while proc.poll() is None:
                time.sleep(0.4)
                if os.path.exists(progress_path):
                    try:
                        with open(progress_path, "r", encoding="utf-8", errors="ignore") as pf:
                            content = pf.read()
                            
                        # Try out_time_us
                        us_matches = time_us_pattern.findall(content)
                        if us_matches:
                            current_sec = int(us_matches[-1]) / 1000000.0
                            progress_pct = int(25 + min(70, (current_sec / total_duration) * 70))
                            update_task(
                                task_id,
                                progress=progress_pct,
                                message=f"Rendering {progress_pct}% (time: {round(current_sec, 1)}s / {round(total_duration, 1)}s)"
                            )
                        else:
                            # Try out_time=HH:MM:SS
                            str_matches = time_str_pattern.findall(content)
                            if str_matches:
                                h, m, s = str_matches[-1]
                                current_sec = int(h) * 3600 + int(m) * 60 + float(s)
                                progress_pct = int(25 + min(70, (current_sec / total_duration) * 70))
                                update_task(
                                    task_id,
                                    progress=progress_pct,
                                    message=f"Rendering {progress_pct}% (time: {round(current_sec, 1)}s / {round(total_duration, 1)}s)"
                                )
                    except Exception:
                        pass

            proc.wait()

        # Check for success
        if proc.returncode != 0:
            err_log = ""
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8", errors="ignore") as lf:
                    err_log = lf.read()[-600:]

            # If NVENC failed, retry with CPU fallback
            if req.use_gpu and "nvenc" in err_log.lower():
                print("NVENC error, falling back to CPU...")
                update_task(task_id, message="NVENC fallback: encoding with CPU libx264...")
                fallback_cmd = [
                    "ffmpeg",
                    "-y",
                    "-i", input_video_path,
                    "-filter_complex", filter_str,
                    "-map", "[outv]",
                    "-map", "0:a?",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    "-progress", progress_path,
                    output_path
                ]
                with open(log_path, "a", encoding="utf-8", errors="ignore") as lf:
                    fb_proc = subprocess.Popen(fallback_cmd, stdout=lf, stderr=lf, cwd=str(TEMP_DIR))
                    fb_proc.wait()
                    if fb_proc.returncode != 0:
                        raise Exception("CPU Render fallback also failed.")
            else:
                raise Exception(f"FFmpeg error: {err_log}")

        update_task(
            task_id,
            status="completed",
            progress=100,
            message="Video rendered successfully!",
            output_filename=output_filename,
            download_url=f"/api/download/{task_id}"
        )

    except Exception as e:
        print(f"Render Task {task_id} failed: {e}")
        update_task(
            task_id,
            status="failed",
            message="Rendering failed.",
            error=str(e)
        )

def start_render_job(task_id: str, req: RenderRequest, input_video_path: str):
    RENDER_TASKS[task_id] = RenderTaskStatus(
        task_id=task_id,
        status="pending",
        progress=0,
        message="Queued render job..."
    )
    thread = threading.Thread(
        target=run_render_pipeline,
        args=(task_id, req, input_video_path),
        daemon=True
    )
    thread.start()
