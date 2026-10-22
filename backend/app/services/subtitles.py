import os
from typing import List
from app.models.schemas import SubtitleSegment, CaptionStyle, WordItem

def hex_to_ass_color(hex_str: str) -> str:
    """Convert hex #RRGGBB to ASS &H00BBGGRR&."""
    hex_clean = hex_str.lstrip("#")
    if len(hex_clean) == 6:
        r, g, b = hex_clean[0:2], hex_clean[2:4], hex_clean[4:6]
        return f"&H00{b}{g}{r}&"
    return "&H00FFFFFF&"

def format_ass_time(seconds: float) -> str:
    """Format seconds into ASS timestamp H:MM:SS.cc"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        centis = 99
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

def generate_ass_subtitles(
    segments: List[SubtitleSegment],
    style: CaptionStyle,
    output_path: str,
    video_width: int = 1080,
    video_height: int = 1920
) -> str:
    """
    Generate an ASS subtitle file with animated karaoke word-level highlights.
    """
    primary_ass = hex_to_ass_color(style.primary_color)
    highlight_ass = hex_to_ass_color(style.highlight_color)
    outline_ass = hex_to_ass_color(style.outline_color)
    shadow_ass = hex_to_ass_color(style.shadow_color)
    
    font_name = style.font_family or "Impact"
    font_size = style.font_size or 40
    # Scale font size relative to video resolution (default 1080x1920)
    scaled_font_size = int(font_size * (video_height / 1920.0) * 1.5)
    
    # Alignment: 2 = Bottom-center, 5 = Middle-center, 8 = Top-center
    margin_v = int(video_height * (1.0 - (style.position_vertical / 100.0)))
    margin_v = max(30, min(video_height - 100, margin_v))

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {video_width}
PlayResY: {video_height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{scaled_font_size},{primary_ass},{highlight_ass},{outline_ass},{shadow_ass},-1,0,0,0,100,100,2,0,1,{style.outline_width},{style.shadow_depth},2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    dialogue_lines = []

    for seg in segments:
        words = seg.words
        if not words:
            continue

        # Split words into digestible chunks for short-form video (max_words_per_line, e.g. 3-4 words)
        chunk_size = max(1, style.max_words_per_line)
        for i in range(0, len(words), chunk_size):
            chunk = words[i:i + chunk_size]
            if not chunk:
                continue
            
            chunk_start = chunk[0].start
            chunk_end = chunk[-1].end
            
            start_str = format_ass_time(chunk_start)
            end_str = format_ass_time(chunk_end)
            
            if style.animation_style == "karaoke":
                # For each word in the chunk, create a dialogue line when it is active,
                # highlighting that active word in highlight_color without any gap flickers
                for active_idx, active_word in enumerate(chunk):
                    w_start_str = format_ass_time(active_word.start)
                    # Next word start or chunk end
                    next_end = chunk[active_idx + 1].start if (active_idx + 1 < len(chunk)) else chunk_end
                    w_end_str = format_ass_time(max(active_word.end, next_end))
                    
                    line_parts = []
                    for w_idx, w in enumerate(chunk):
                        word_text = w.word.upper() if style.uppercase else w.word
                        if w_idx == active_idx:
                            # Active word highlighted
                            line_parts.append(f"{{\\c{highlight_ass}\\fscx108\\fscy108}}{word_text}{{\\c{primary_ass}\\fscx100\\fscy100}}")
                        else:
                            line_parts.append(word_text)
                    
                    dialogue_text = " ".join(line_parts)
                    dialogue_lines.append(f"Dialogue: 0,{w_start_str},{w_end_str},Default,,0,0,0,,{dialogue_text}")
            
            elif style.animation_style == "word_by_word":
                # Only show words up to current word or single word pop-in
                for active_word in chunk:
                    w_start_str = format_ass_time(active_word.start)
                    w_end_str = format_ass_time(active_word.end)
                    word_text = active_word.word.upper() if style.uppercase else active_word.word
                    dialogue_text = f"{{\\c{highlight_ass}\\fscx112\\fscy112}}{word_text}"
                    dialogue_lines.append(f"Dialogue: 0,{w_start_str},{w_end_str},Default,,0,0,0,,{dialogue_text}")
            
            else:
                # Static chunk
                text_parts = [w.word.upper() if style.uppercase else w.word for w in chunk]
                dialogue_text = " ".join(text_parts)
                dialogue_lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{dialogue_text}")

    content = header + "\n".join(dialogue_lines) + "\n"
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    return output_path
