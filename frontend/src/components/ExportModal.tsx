import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, CheckCircle2, AlertCircle, Zap, Cpu, Film, MessageSquare } from 'lucide-react';
import { UploadedVideo, CropConfig, CaptionStyle, SubtitleSegment, RenderTaskStatus } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: UploadedVideo;
  crop: CropConfig;
  style: CaptionStyle;
  segments: SubtitleSegment[];
  useGpu: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  video,
  crop,
  style,
  segments,
  useGpu,
}) => {
  const [quality, setQuality] = useState<'1080p' | '720p'>('1080p');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<RenderTaskStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setTaskStatus(data);
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to poll status', err);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [taskId]);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsStarting(true);
    setTaskStatus(null);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: video.video_id,
          crop,
          style,
          segments,
          quality,
          use_gpu: useGpu,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTaskId(data.task_id);
      } else {
        throw new Error('Failed to start render');
      }
    } catch (e: any) {
      setTaskStatus({
        task_id: '',
        status: 'failed',
        progress: 0,
        message: 'COULD NOT QUEUE RENDER',
        error: e.message,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const isCompleted = taskStatus?.status === 'completed';
  const isFailed = taskStatus?.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-fade-in font-mono">
      <div className="bg-[#18191B] border-4 border-black max-w-lg w-full p-6 shadow-brutal-lg relative text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#FFE600] border border-black inline-block" />
            <h2 className="text-base font-black uppercase tracking-wider text-[#FFE600]">
              [EXPORT // RENDER PIPELINE]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#26282B] border-2 border-black hover:bg-black text-white hover:text-[#FFE600] transition"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Settings before rendering */}
        {!taskId && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                // TARGET RESOLUTION
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuality('1080p')}
                  className={`p-3 border-2 border-black text-left transition select-none ${
                    quality === '1080p'
                      ? 'bg-[#FFE600] text-black font-black shadow-brutal'
                      : 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
                  }`}
                >
                  <div className="font-black text-xs uppercase">1080P FULL HD</div>
                  <div className="text-[10px] opacity-80 uppercase">Crisp upload quality</div>
                </button>

                <button
                  onClick={() => setQuality('720p')}
                  className={`p-3 border-2 border-black text-left transition select-none ${
                    quality === '720p'
                      ? 'bg-[#FFE600] text-black font-black shadow-brutal'
                      : 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
                  }`}
                >
                  <div className="font-black text-xs uppercase">720P FAST RENDER</div>
                  <div className="text-[10px] opacity-80 uppercase">Optimized for low-end</div>
                </button>
              </div>
            </div>

            <div className="p-3 bg-black border-2 border-black flex items-center justify-between text-xs">
              <span className="text-zinc-400 uppercase font-bold">ENCODER:</span>
              <span className="font-bold flex items-center gap-1.5 text-white">
                {useGpu ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#00FF66] fill-[#00FF66]" /> NVIDIA NVENC ACCELERATED
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" /> CPU LIBX264 VERYFAST
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-black border-2 border-black flex items-center justify-between text-xs">
              <span className="text-zinc-400 uppercase font-bold">FRAMING:</span>
              <span className="font-black text-[#FFE600] uppercase">
                {crop.aspect_ratio} • {crop.fit_mode}
              </span>
            </div>

            <div className="p-3 bg-black border-2 border-black flex items-center justify-between text-xs">
              <span className="text-zinc-400 uppercase font-bold">RSMB MOTION BLUR:</span>
              <span className={`font-black uppercase ${crop.motion_blur ? 'text-[#00F0FF]' : 'text-zinc-500'}`}>
                {crop.motion_blur ? `ENABLED (${crop.motion_blur_intensity || 50}%)` : 'DISABLED'}
              </span>
            </div>

            {segments.length === 0 ? (
              <div className="p-3 bg-[#FFE600] text-black border-2 border-black flex items-start gap-2 text-xs font-bold shadow-brutal-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black uppercase">NO CAPTIONS TRANSCRIBED YET</span>
                  <p className="font-normal text-[11px] opacity-90 mt-0.5">
                    Click &apos;Auto-Transcribe&apos; on the left panel to generate subtitles, or proceed to export video without captions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-black border-2 border-black flex items-center justify-between text-xs">
                <span className="text-zinc-400 uppercase font-bold">CAPTIONS:</span>
                <span className="font-bold text-[#00FF66] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {segments.length} BLOCKS (FIRST AT {segments[0]?.start?.toFixed(1)}s)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Active Progress View */}
        {taskId && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-black uppercase">
              <span className="text-zinc-200">
                {taskStatus?.message || 'INITIALIZING ENCODER...'}
              </span>
              <span className="text-[#FFE600] bg-black border border-black px-2 py-0.5">
                {taskStatus?.progress || 0}%
              </span>
            </div>

            {/* Brutalist Progress Bar */}
            <div className="w-full h-5 bg-black border-2 border-black p-0.5">
              <div
                className="h-full bg-[#FFE600] transition-all duration-300"
                style={{ width: `${taskStatus?.progress || 0}%` }}
              />
            </div>

            {isCompleted && (
              <div className="p-3 bg-[#00FF66] text-black border-2 border-black font-black text-xs flex items-center gap-2 shadow-brutal">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 stroke-[3]" />
                <span>RENDER FINISHED! 100% OFFLINE EXPORT READY.</span>
              </div>
            )}

            {isFailed && (
              <div className="p-3 bg-[#FF3366] text-black border-2 border-black font-black text-xs flex items-center gap-2 shadow-brutal">
                <AlertCircle className="w-4 h-4 flex-shrink-0 stroke-[3]" />
                <span>{taskStatus?.error || 'RENDERING ERROR'}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 pt-3 border-t-2 border-black">
          {!taskId && (
            <button
              onClick={handleStartRender}
              disabled={isStarting}
              className="btn-brutal w-full py-3 bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                  <span>STARTING ENCODER...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 stroke-[2.5]" />
                  <span>START EXPORT ({crop.aspect_ratio})</span>
                </>
              )}
            </button>
          )}

          {isCompleted && (
            <a
              href={taskStatus?.download_url || '#'}
              download={taskStatus?.output_filename || 'cliption_video.mp4'}
              className="btn-brutal w-full py-3 bg-[#00FF66] hover:bg-[#33FF85] text-black font-black text-xs flex items-center justify-center gap-2 block text-center"
            >
              <Download className="w-4 h-4 stroke-[3] inline" />
              <span>DOWNLOAD FINAL VIDEO (.MP4)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
