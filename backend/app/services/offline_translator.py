from typing import List
from app.models.schemas import SubtitleSegment, WordItem

# Popular language mapping
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "zh-CN": "Chinese (Simplified)",
    "ar": "Arabic",
    "pt": "Portuguese",
    "ru": "Russian",
    "it": "Italian",
    "ko": "Korean",
    "bn": "Bengali",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
    "tr": "Turkish",
    "id": "Indonesian"
}

def translate_segments(segments: List[SubtitleSegment], target_lang: str) -> List[SubtitleSegment]:
    """
    Translates a list of SubtitleSegments into target_lang while
    recalculating and aligning word-level timestamps.
    """
    if not segments or target_lang == "original":
        return segments

    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source="auto", target=target_lang)
    except Exception as e:
        print(f"Translation library error: {e}")
        return segments

    translated_segments: List[SubtitleSegment] = []

    for seg in segments:
        original_text = seg.text.strip()
        if not original_text:
            translated_segments.append(seg)
            continue

        try:
            translated_text = translator.translate(original_text)
        except Exception as e:
            print(f"Failed to translate segment '{original_text}': {e}")
            translated_text = original_text

        # Re-align words in translated text across the same duration
        translated_tokens = translated_text.split()
        total_tokens = len(translated_tokens)
        duration = max(0.1, seg.end - seg.start)

        new_words: List[WordItem] = []
        if total_tokens > 0:
            time_per_token = duration / total_tokens
            for idx, token in enumerate(translated_tokens):
                w_start = seg.start + (idx * time_per_token)
                w_end = min(seg.end, w_start + time_per_token)
                new_words.append(WordItem(
                    word=token,
                    start=round(w_start, 2),
                    end=round(w_end, 2),
                    probability=0.95
                ))

        translated_segments.append(SubtitleSegment(
            id=seg.id,
            start=seg.start,
            end=seg.end,
            text=translated_text,
            words=new_words
        ))

    return translated_segments
