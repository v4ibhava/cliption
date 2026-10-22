export interface GpuInfo {
  name: string;
  vram_total_mb: number;
  vram_free_mb?: number;
  cuda_available: boolean;
  driver_version?: string;
}

export interface CpuInfo {
  name: string;
  physical_cores: number;
  logical_threads: number;
  ram_total_gb: number;
}

export interface SystemSpecs {
  cpu: CpuInfo;
  gpu?: GpuInfo;
  has_nvidia: boolean;
  recommended_tier: 'small' | 'medium' | 'large';
  recommended_device: 'cuda' | 'cpu';
  recommendation_reason: string;
}

export interface WordItem {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WordItem[];
}

export type AspectRatioType = '9:16' | '1:1' | '4:5' | '16:9';
export type FitModeType = 'blur_background' | 'crop' | 'fit';

export interface CropConfig {
  aspect_ratio: AspectRatioType;
  fit_mode: FitModeType;
  pan_x: number;
  pan_y: number;
  zoom: number;
  blur_intensity: number;
  motion_blur?: boolean;
  motion_blur_intensity?: number;
}

export interface CaptionStyle {
  preset_name: string;
  font_family: string;
  font_size: number;
  primary_color: string;
  highlight_color: string;
  outline_color: string;
  outline_width: number;
  shadow_depth: number;
  shadow_color: string;
  position_vertical: number;
  uppercase: boolean;
  animation_style: 'karaoke' | 'word_by_word' | 'box' | 'none';
  max_words_per_line: number;
}

export interface UploadedVideo {
  video_id: string;
  filename: string;
  width: number;
  height: number;
  duration: number;
  aspect_ratio: number;
  preview_url: string;
}

export interface RenderTaskStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  output_filename?: string;
  download_url?: string;
  error?: string;
}
