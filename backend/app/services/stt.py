import os
import sys
import time
import wave
import numpy as np
from typing import List, Optional, Tuple, Union

def setup_cuda_dll_paths():
    """Locate and register all bundled NVIDIA CUDA/cuDNN DLLs on Windows."""
    try:
        for p in sys.path:
            nvidia_dir = os.path.join(p, "nvidia")
            if os.path.exists(nvidia_dir):
                for root, dirs, files in os.walk(nvidia_dir):
                    if any(f.endswith(".dll") for f in files):
                        try:
                            os.add_dll_directory(root)
                        except Exception:
                            pass
                        if root not in os.environ.get("PATH", ""):
                            os.environ["PATH"] = root + os.pathsep + os.environ.get("PATH", "")
    except Exception as e:
        print(f"CUDA DLL path setup warning: {e}")

setup_cuda_dll_paths()

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

from faster_whisper import WhisperModel
from app.config import MODELS_DIR
from app.models.schemas import SubtitleSegment, WordItem

# Cache loaded models in memory to avoid reloading on repeated requests
_MODEL_CACHE = {}

def get_whisper_model(tier: str = "small", device: str = "cpu") -> WhisperModel:
    """Load or retrieve cached WhisperModel based on tier and device."""
    tier_to_model = {
        "small": "base",              # ~140MB, ultra-light
        "medium": "small",            # ~460MB, balanced
        "large": "large-v3-turbo",     # ~1.6GB, state-of-the-art multilingual
    }
    model_name = tier_to_model.get(tier.lower(), "base")
    
    if device == "cuda":
        compute_type = "float16"
    else:
        compute_type = "int8"
    
    cache_key = f"{model_name}_{device}_{compute_type}"
    if cache_key in _MODEL_CACHE:
        return _MODEL_CACHE[cache_key]
    
    try:
        model = WhisperModel(
            model_name,
            device=device,
            compute_type=compute_type,
            download_root=str(MODELS_DIR),
            cpu_threads=4 if device == "cpu" else 0
        )
        _MODEL_CACHE[cache_key] = model
        return model
    except Exception as e:
        if device == "cuda":
            print(f"CUDA initialization failed ({e}), falling back to CPU INT8...")
            fallback_key = f"{model_name}_cpu_int8"
            if fallback_key in _MODEL_CACHE:
                return _MODEL_CACHE[fallback_key]
            model = WhisperModel(
                model_name,
                device="cpu",
                compute_type="int8",
                download_root=str(MODELS_DIR),
                cpu_threads=4
            )
            _MODEL_CACHE[fallback_key] = model
            return model
        raise e

def load_audio_buffer(audio_path: str) -> Union[np.ndarray, str]:
    """Safely load 16kHz mono WAV into a float32 NumPy array."""
    try:
        with wave.open(audio_path, "rb") as wf:
            n_channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            sampwidth = wf.getsampwidth()
            
            if n_channels == 1 and sample_rate == 16000 and sampwidth == 2:
                raw_bytes = wf.readframes(wf.getnframes())
                audio_np = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                return audio_np
    except Exception as e:
        print(f"Direct wave read fallback: {e}")
        
    return audio_path

def transcribe_audio_file(
    audio_path: str,
    tier: str = "small",
    device: str = "cpu",
    language: Optional[str] = None
) -> Tuple[List[SubtitleSegment], str]:
    """
    Transcribes audio using faster-whisper with word-level timestamps.
    Automatically handles CUDA execution and falls back to CPU INT8 if needed.
    """
    audio_input = load_audio_buffer(audio_path)
    
    try:
        model = get_whisper_model(tier=tier, device=device)
        segments_raw, info = model.transcribe(
            audio_input,
            beam_size=5,
            word_timestamps=True,
            language=language,
            vad_filter=False,
            condition_on_previous_text=False
        )
    except Exception as e:
        err_msg = str(e).lower()
        if device == "cuda" and ("cublas" in err_msg or "cuda" in err_msg or "dll" in err_msg):
            print(f"CUDA transcription forward pass failed ({e}), seamlessly falling back to CPU INT8...")
            model = get_whisper_model(tier=tier, device="cpu")
            segments_raw, info = model.transcribe(
                audio_input,
                beam_size=5,
                word_timestamps=True,
                language=language,
                vad_filter=False,
                condition_on_previous_text=False
            )
        else:
            raise e
    
    detected_lang = info.language or "en"
    result_segments: List[SubtitleSegment] = []
    
    segment_idx = 0
    for seg in segments_raw:
        words: List[WordItem] = []
        if seg.words:
            for w in seg.words:
                cleaned_word = w.word.strip()
                if cleaned_word:
                    words.append(WordItem(
                        word=cleaned_word,
                        start=round(w.start, 2),
                        end=round(w.end, 2),
                        probability=round(w.probability, 2)
                    ))
        
        if not words and seg.text.strip():
            tokens = seg.text.strip().split()
            duration = max(0.1, seg.end - seg.start)
            time_per_word = duration / max(1, len(tokens))
            for i, token in enumerate(tokens):
                w_start = seg.start + (i * time_per_word)
                w_end = min(seg.end, w_start + time_per_word)
                words.append(WordItem(
                    word=token,
                    start=round(w_start, 2),
                    end=round(w_end, 2),
                    probability=0.9
                ))
        
        if words:
            result_segments.append(SubtitleSegment(
                id=segment_idx,
                start=round(seg.start, 2),
                end=round(seg.end, 2),
                text=seg.text.strip(),
                words=words
            ))
            segment_idx += 1
            
    return result_segments, detected_lang
