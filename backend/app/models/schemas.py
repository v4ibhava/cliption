from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Hardware & System Info
class GpuInfo(BaseModel):
    name: str
    vram_total_mb: int
    vram_free_mb: Optional[int] = None
    cuda_available: bool = False
    driver_version: Optional[str] = None

class CpuInfo(BaseModel):
    name: str
    physical_cores: int
    logical_threads: int
    ram_total_gb: float

class SystemSpecs(BaseModel):
    cpu: CpuInfo
    gpu: Optional[GpuInfo] = None
    has_nvidia: bool = False
    recommended_tier: Literal["small", "medium", "large"] = "small"
    recommended_device: Literal["cuda", "cpu"] = "cpu"
    recommendation_reason: str

# Model Tiers
class ModelTierConfig(BaseModel):
    tier: Literal["small", "medium", "large"] = "small"
    device: Literal["cuda", "cpu"] = "cpu"
    whisper_model: str = "base" # tiny, base, small, large-v3-turbo
    compute_type: str = "int8"   # int8, float16

# Subtitle Word & Segment
class WordItem(BaseModel):
    word: str
    start: float
    end: float
    probability: Optional[float] = 1.0

class SubtitleSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    words: List[WordItem] = Field(default_factory=list)

# Style & Preset
class CaptionStyle(BaseModel):
    preset_name: str = "mrbeast" # mrbeast, hormozi, minimal, cyberpunk, custom
    font_family: str = "Impact"
    font_size: int = 38
    primary_color: str = "#FFFFFF"     # White
    highlight_color: str = "#FFE600"   # Yellow
    outline_color: str = "#000000"     # Black
    outline_width: int = 4
    shadow_depth: int = 2
    shadow_color: str = "#000000"
    position_vertical: int = 80        # Percentage from top (e.g. 80 = lower third)
    uppercase: bool = True
    animation_style: Literal["karaoke", "word_by_word", "box", "none"] = "karaoke"
    max_words_per_line: int = 4

# Cropping & Framing
class CropConfig(BaseModel):
    aspect_ratio: Literal["9:16", "1:1", "4:5", "16:9"] = "9:16"
    fit_mode: Literal["blur_background", "crop", "fit"] = "blur_background"
    pan_x: float = 0.5 # 0.0 to 1.0, 0.5 is centered
    pan_y: float = 0.5 # 0.0 to 1.0, 0.5 is centered
    zoom: float = 1.0   # 0.5 to 2.0 (1.0 = standard fill, <1.0 = zoom out, >1.0 = zoom in)
    blur_intensity: int = 25
    motion_blur: bool = False
    motion_blur_intensity: int = 50 # 1 to 100

# Requests
class TranscribeRequest(BaseModel):
    video_id: str
    tier: Literal["small", "medium", "large"] = "small"
    device: Literal["cuda", "cpu"] = "cpu"
    language: Optional[str] = None # None = auto detect

class TranslateRequest(BaseModel):
    segments: List[SubtitleSegment]
    target_language: str # e.g., 'es', 'hi', 'fr', 'de', 'en', etc.

class RenderRequest(BaseModel):
    video_id: str
    crop: CropConfig
    style: CaptionStyle
    segments: List[SubtitleSegment]
    quality: Literal["720p", "1080p"] = "1080p"
    use_gpu: bool = True

class RenderTaskStatus(BaseModel):
    task_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: int = 0
    message: str = ""
    output_filename: Optional[str] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
