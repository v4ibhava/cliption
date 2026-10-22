import os
import subprocess
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.config import TEMP_DIR, OUTPUT_DIR
from app.services.video import build_filter_complex, get_video_info
from app.services.subtitles import generate_ass_subtitles
from app.models.schemas import CaptionStyle, SubtitleSegment, WordItem, CropConfig
import static_ffmpeg

static_ffmpeg.add_paths()

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_system_specs():
    res = client.get("/api/system-specs")
    assert res.status_code == 200
    data = res.json()
    assert "cpu" in data
    assert "recommended_tier" in data
    assert data["recommended_tier"] in ["small", "medium", "large"]
    assert "recommended_device" in data
    print("Detected specs:", data["recommendation_reason"])

def test_end_to_end_render():
    """Generates a synthetic 3-second test clip and tests the 9:16 blurred background render pipeline."""
    test_video_path = str(TEMP_DIR / "test_synth.mp4")
    # Generate 3-second test video with test tone
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=3:size=640x360:rate=24",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
        "-c:v", "libx264", "-c:a", "aac",
        test_video_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    assert os.path.exists(test_video_path)

    # Subtitle segments
    segments = [
        SubtitleSegment(
            id=0,
            start=0.2,
            end=2.8,
            text="WELCOME TO CLIPTION",
            words=[
                WordItem(word="WELCOME", start=0.2, end=1.0),
                WordItem(word="TO", start=1.0, end=1.5),
                WordItem(word="CLIPTION", start=1.5, end=2.8),
            ]
        )
    ]

    style = CaptionStyle(
        preset_name="mrbeast",
        font_family="Arial",
        font_size=32,
        primary_color="#FFFFFF",
        highlight_color="#FFE600",
        outline_color="#000000",
        outline_width=3,
        shadow_depth=2,
        position_vertical=80,
        uppercase=True,
        animation_style="karaoke"
    )

    ass_path = str(TEMP_DIR / "test_sub.ass")
    generate_ass_subtitles(segments, style, ass_path, video_width=720, video_height=1280)
    assert os.path.exists(ass_path)

    # Build filter
    filter_complex = build_filter_complex(
        target_w=720,
        target_h=1280,
        fit_mode="blur_background",
        subtitles_path=ass_path,
        pan_x=0.5,
        pan_y=0.5,
        blur_intensity=20
    )

    out_mp4 = str(OUTPUT_DIR / "test_out_9_16.mp4")
    render_cmd = [
        "ffmpeg", "-y",
        "-i", test_video_path,
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-map", "0:a",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "copy",
        out_mp4
    ]
    subprocess.run(render_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    assert os.path.exists(out_mp4)
    info = get_video_info(out_mp4)
    assert info["width"] == 720
    assert info["height"] == 1280
    print(f"Render verified! Output dimensions: {info['width']}x{info['height']}")

if __name__ == "__main__":
    test_health()
    test_system_specs()
    test_end_to_end_render()
    print("ALL TESTS PASSED SUCCESSFULLY!")
