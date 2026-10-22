import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';
import { UploadedVideo, CropConfig, CaptionStyle, SubtitleSegment, WordItem } from '../types';

interface VideoPlayerProps {
  video: UploadedVideo;
  crop: CropConfig;
  style: CaptionStyle;
  segments: SubtitleSegment[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  crop,
  style,
  segments,
  currentTime,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(video.duration || 0);

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
    <div className="flex flex-col items-center w-full font-mono">
      {/* Motion Blur SVG Filter */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <filter id="preview-motion-blur">
          <feGaussianBlur
            stdDeviation={`${isPlaying && crop.motion_blur ? Math.min(1.8, Math.max(0.5, (crop.motion_blur_intensity || 50) * 0.02)) : 0} 0`}
          />
        </filter>
      </svg>

      {/* Video Container with Heavy Brutalist Frame */}
      <div
        ref={containerRef}
        onClick={togglePlay}
        className={`relative overflow-hidden bg-black border-4 border-black shadow-brutal-lg cursor-pointer select-none group ${
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
            ...(crop.fit_mode === 'crop'
              ? {
                  transform: `scale(${crop.zoom !== undefined ? crop.zoom : 3.16})`,
                  transformOrigin: `${crop.pan_x * 100}% 50%`,
                }
              : {}),
            filter: crop.motion_blur && isPlaying ? 'url(#preview-motion-blur)' : undefined,
          }}
        />

        {/* Layer 3: Dynamic Live Subtitles Overlay (Real or Sample Preview) */}
        {shouldShowCaptions && (
          <div
            className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none px-4 transition-all duration-75"
            style={{
              top: `${style.position_vertical}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <div
              style={fontStyle}
              className="text-center font-black tracking-wide leading-snug drop-shadow-2xl"
            >
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
        <div className="absolute inset-0 z-30 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="p-4 bg-[#FFE600] text-black border-3 border-black shadow-brutal">
            {isPlaying ? <Pause className="w-8 h-8 stroke-[3]" /> : <Play className="w-8 h-8 fill-black ml-0.5" />}
          </div>
        </div>

        {/* Top Video Specs Badges */}
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1 pointer-events-none">
          <span className="bg-black text-[#FFE600] border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">
            {crop.aspect_ratio}
          </span>
          <span className="bg-[#FFE600] text-black border-2 border-black px-1.5 py-0.5 text-[10px] font-black uppercase">
            {crop.fit_mode === 'blur_background' ? 'BLUR-BG' : crop.fit_mode}
          </span>
          {crop.motion_blur && (
            <span className="bg-[#00F0FF] text-black border-2 border-black px-1.5 py-0.5 text-[10px] font-black uppercase shadow-brutal-sm">
              M-BLUR {crop.motion_blur_intensity || 50}%
            </span>
          )}
        </div>

        {/* Sample Preview indicator pill */}
        {isSamplePreview && (
          <div className="absolute top-2 right-2 z-30 pointer-events-none">
            <span className="bg-[#FFE600] text-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-brutal-sm flex items-center gap-1">
              <Eye className="w-3 h-3 stroke-[3]" /> STYLE PREVIEW (CLICK TRANSCRIBE TO BURN)
            </span>
          </div>
        )}

        {/* Silence indicator when real segments exist but no speech at current time */}
        {!isSamplePreview && segments.length > 0 && activeChunk.length === 0 && (
          <div className="absolute top-2 right-2 z-30 pointer-events-none">
            <span className="bg-black/90 text-zinc-400 border border-black px-2 py-0.5 text-[9px] font-mono shadow-brutal-sm">
              [SILENCE // SPEECH STARTS {segments[0]?.start?.toFixed(1)}s]
            </span>
          </div>
        )}
      </div>

      {/* Scrub & Playback Controls Bar */}
      <div className="w-full max-w-xl mt-3 px-3 py-2 bg-[#18191B] border-2 border-black shadow-brutal flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black p-1.5"
        >
          {isPlaying ? <Pause className="w-4 h-4 stroke-[3]" /> : <Play className="w-4 h-4 fill-black" />}
        </button>

        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.currentTime = 0;
            onTimeUpdate(0);
          }}
          className="btn-brutal bg-[#26282B] text-white hover:text-[#FFE600] p-1.5"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Brutalist Slider */}
        <input
          type="range"
          min={0}
          max={duration || 10}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-3 bg-black border-2 border-black appearance-none cursor-pointer accent-[#FFE600]"
        />

        {/* Time display */}
        <div className="text-xs bg-black text-[#00FF66] border border-black px-2 py-1 font-bold w-24 text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <button
          onClick={toggleMute}
          className="btn-brutal bg-[#26282B] text-white p-1.5"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#FF3366]" /> : <Volume2 className="w-4 h-4" />}
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
