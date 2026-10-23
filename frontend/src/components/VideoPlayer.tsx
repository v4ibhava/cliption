import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, GripVertical, MoveVertical } from 'lucide-react';
import { UploadedVideo, CropConfig, CaptionStyle, SubtitleSegment, WordItem } from '../types';

interface VideoPlayerProps {
  video: UploadedVideo;
  crop: CropConfig;
  style: CaptionStyle;
  segments: SubtitleSegment[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onCaptionPositionChange?: (newYPercent: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  crop,
  style,
  segments,
  currentTime,
  onTimeUpdate,
  onCaptionPositionChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(video.duration || 0);
  const [isHoveringCaption, setIsHoveringCaption] = useState(false);
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);

  // Sample word cycle when no segments exist yet
  const [sampleActiveIdx, setSampleActiveIdx] = useState(1);
  const sampleWords = ['YOUR', 'VIRAL', 'CAPTION', 'HERE'];

  useEffect(() => {
    if (segments.length === 0) {
      const interval = setInterval(() => {
        setSampleActiveIdx((prev) => (prev + 1) % sampleWords.length);
      }, 850);
      return () => clearInterval(interval);
    }
  }, [segments.length, sampleWords.length]);

  // Sync background video if blur_background is active
  useEffect(() => {
    if (bgVideoRef.current && videoRef.current) {
      bgVideoRef.current.currentTime = videoRef.current.currentTime;
      if (isPlaying) {
        bgVideoRef.current.play().catch(() => {});
      } else {
        bgVideoRef.current.pause();
      }
    }
  }, [isPlaying, currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.currentTime = time;
    }
    onTimeUpdate(time);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleCaptionMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onCaptionPositionChange) return;

    setIsDraggingCaption(true);
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return;
      const relativeY = moveEvent.clientY - rect.top;
      const rawPct = (relativeY / rect.height) * 100;
      const clampedPct = Math.round(Math.max(15, Math.min(90, rawPct)));
      onCaptionPositionChange(clampedPct);
    };

    const onMouseUp = () => {
      setIsDraggingCaption(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Find currently active words and chunk
  let activeChunk: WordItem[] = [];
  let activeWordIndex = -1;

  if (segments.length > 0) {
    for (const seg of segments) {
      if (currentTime >= seg.start - 0.1 && currentTime <= seg.end + 0.2) {
        const chunk_size = Math.max(1, style.max_words_per_line);
        const words = seg.words;

        for (let i = 0; i < words.length; i += chunk_size) {
          const chunk = words.slice(i, i + chunk_size);
          const chunkStart = chunk[0].start;
          const chunkEnd = chunk[chunk.length - 1].end;

          if (currentTime >= chunkStart - 0.05 && currentTime <= chunkEnd + 0.25) {
            activeChunk = chunk;
            activeWordIndex = chunk.findIndex(
              (w) => currentTime >= w.start && currentTime <= w.end + 0.1
            );
            if (activeWordIndex === -1 && chunk.length > 0) {
              activeWordIndex = 0;
            }
            break;
          }
        }
        if (activeChunk.length > 0) break;
      }
    }
  }

  // Sample preview is only active when NO real subtitles have been generated yet
  const isSamplePreview = segments.length === 0;
  const shouldShowCaptions = activeChunk.length > 0 || isSamplePreview;
  const displayWords = isSamplePreview ? sampleWords : activeChunk.map((w) => w.word);
  const highlightedIdx = isSamplePreview ? sampleActiveIdx : activeWordIndex;

  const aspectClasses = {
    '9:16': 'aspect-[9/16] max-h-[580px] w-auto mx-auto',
    '1:1': 'aspect-square max-h-[520px] w-auto mx-auto',
    '4:5': 'aspect-[4/5] max-h-[540px] w-auto mx-auto',
    '16:9': 'aspect-video w-full max-w-2xl mx-auto',
  };

  const fontStyle = {
    fontFamily: style.font_family,
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Video Container */}
      <div
        ref={containerRef}
        onClick={togglePlay}
        className={`relative overflow-hidden bg-black rounded-2xl border border-zinc-800 shadow-xl cursor-pointer select-none group ${
          aspectClasses[crop.aspect_ratio]
        }`}
      >
        {/* Layer 1: Blurred Background Video */}
        {crop.fit_mode === 'blur_background' && (
          <video
            ref={bgVideoRef}
            src={video.preview_url}
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover scale-125 opacity-70 pointer-events-none transition-all duration-75"
            style={{
              filter: `blur(${crop.blur_intensity || 25}px)`,
            }}
          />
        )}

        {/* Layer 2: Main Video Layer */}
        <video
          ref={videoRef}
          src={video.preview_url}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || video.duration)}
          onEnded={() => setIsPlaying(false)}
          className="relative z-10 w-full h-full object-contain transition-transform duration-75"
          style={{
            transform: `scale(${crop.zoom !== undefined ? crop.zoom : (crop.fit_mode === 'crop' ? 3.16 : 1.0)})`,
            transformOrigin: `${crop.pan_x * 100}% 50%`,
          }}
        />

        {/* Alignment Guide Line during drag */}
        {isDraggingCaption && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center justify-between px-3 border-b-2 border-dashed border-indigo-400"
            style={{
              top: `${style.position_vertical}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <span className="text-[10px] font-mono bg-indigo-600 text-white px-2 py-0.5 rounded shadow font-semibold">
              Caption Line
            </span>
            <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-2 py-0.5 rounded shadow">
              {style.position_vertical}%
            </span>
          </div>
        )}

        {/* Layer 3: Dynamic Live Subtitles Overlay */}
        {shouldShowCaptions && (
          <div
            className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none px-4 transition-all duration-75 select-none"
            style={{
              top: `${style.position_vertical}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <div
              onMouseEnter={() => setIsHoveringCaption(true)}
              onMouseLeave={() => setIsHoveringCaption(false)}
              onMouseDown={handleCaptionMouseDown}
              style={fontStyle}
              className={`relative pointer-events-auto cursor-grab active:cursor-grabbing text-center font-bold tracking-wide leading-snug drop-shadow-2xl transition-all rounded-xl p-2 ${
                isHoveringCaption || isDraggingCaption
                  ? 'border-2 border-dashed border-indigo-400 bg-black/60 shadow-2xl backdrop-blur-sm'
                  : 'border border-transparent'
              }`}
              title="Drag up or down to adjust caption position"
            >
              {/* Drag Handle & Position Tooltip on Hover / Drag */}
              {(isHoveringCaption || isDraggingCaption) && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold shadow-lg whitespace-nowrap pointer-events-none transition-all">
                  <GripVertical className="w-3 h-3" />
                  <span>Drag to reposition · {style.position_vertical}%</span>
                </div>
              )}

              <div
                className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-1.5 max-w-full"
                style={{
                  fontSize: `${style.font_size}px`,
                }}
              >
                {displayWords.map((word, idx) => {
                  const isActive = idx === highlightedIdx;
                  const wordText = style.uppercase ? word.toUpperCase() : word;

                  return (
                    <span
                      key={idx}
                      className={`inline-block transition-transform duration-100 ${
                        isActive ? 'scale-110 font-black' : 'scale-100 opacity-90'
                      }`}
                      style={{
                        color: isActive ? style.highlight_color : style.primary_color,
                        WebkitTextStroke: `${style.outline_width}px ${style.outline_color}`,
                        textShadow: `${style.shadow_depth * 2}px ${style.shadow_depth * 2}px 0px ${style.shadow_color}`,
                        paintOrder: 'stroke fill',
                      }}
                    >
                      {wordText}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 z-30 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg backdrop-blur">
            {isPlaying ? <Pause className="w-6 h-6 stroke-[2.5]" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
          </div>
        </div>

        {/* Top Video Specs Badges */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/70 backdrop-blur-md border border-white/10 text-white">
            {crop.aspect_ratio}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 capitalize">
            {crop.fit_mode === 'blur_background' ? 'Blur BG' : crop.fit_mode === 'crop' ? 'Fill & Pan' : 'Letterbox'}
          </span>
        </div>

        {/* Sample Preview indicator pill */}
        {isSamplePreview && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-600/90 text-white backdrop-blur-md shadow-sm flex items-center gap-1">
              <Eye className="w-3 h-3 stroke-[2]" /> Demo Style Preview
            </span>
          </div>
        )}

        {/* Silence indicator when real segments exist but no speech at current time */}
        {!isSamplePreview && segments.length > 0 && activeChunk.length === 0 && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/80 text-zinc-400 backdrop-blur-md border border-white/10">
              Audio Silence · Speech at {segments[0]?.start?.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Scrub & Playback Controls Bar */}
      <div className="w-full max-w-xl mt-4 px-4 py-2.5 bg-[#14161b] border border-zinc-800 rounded-xl flex items-center gap-3 shadow-sm">
        <button
          onClick={togglePlay}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
        </button>

        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.currentTime = 0;
            onTimeUpdate(0);
          }}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={duration || 10}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />

        {/* Time display */}
        <div className="text-xs font-mono text-zinc-400 w-24 text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <button
          onClick={toggleMute}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
