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
        message: 'Could not queue render',
        error: e.message,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const isCompleted = taskStatus?.status === 'completed';
  const isFailed = taskStatus?.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#14161b] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Export Video
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Render cropped video with burned-in animated subtitles</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings before rendering */}
        {!taskId && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">
                Target Resolution
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuality('1080p')}
                  className={`p-3 rounded-xl border text-left transition select-none ${
                    quality === '1080p'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium ring-1 ring-indigo-500/50'
                      : 'border-zinc-800 bg-[#1a1d24] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">1080p Full HD</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">High definition output</div>
                </button>

                <button
                  onClick={() => setQuality('720p')}
                  className={`p-3 rounded-xl border text-left transition select-none ${
                    quality === '720p'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium ring-1 ring-indigo-500/50'
                      : 'border-zinc-800 bg-[#1a1d24] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">720p Fast Render</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Faster encoding speed</div>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#1a1d24] border border-zinc-800/80 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Encoder:</span>
                <span className="font-medium flex items-center gap-1.5 text-white">
                  {useGpu ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> NVIDIA NVENC Accelerated
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" /> CPU libx264 veryfast
                    </>
                  )}
                </span>
              </div>

              <div className="p-3 bg-[#1a1d24] border border-zinc-800/80 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Framing:</span>
                <span className="font-medium text-white">
                  {crop.aspect_ratio} · {crop.fit_mode}
                </span>
              </div>

              <div className="p-3 bg-[#1a1d24] border border-zinc-800/80 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Motion Blur (RSMB):</span>
                <span className={`font-medium ${crop.motion_blur ? 'text-indigo-400' : 'text-zinc-500'}`}>
                  {crop.motion_blur ? `Enabled (${crop.motion_blur_intensity || 50}%)` : 'Disabled'}
                </span>
              </div>

              {segments.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">No subtitles generated yet</span>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      You can generate captions using &quot;Generate Captions&quot; in the editor, or proceed to export the cropped video without subtitles.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#1a1d24] border border-zinc-800/80 rounded-lg flex items-center justify-between">
                  <span className="text-zinc-400">Subtitles:</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {segments.length} blocks (Speech starts at {segments[0]?.start?.toFixed(1)}s)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Progress View */}
        {taskId && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">
                {taskStatus?.message || 'Initializing encoder...'}
              </span>
              <span className="text-indigo-400 font-semibold font-mono">
                {taskStatus?.progress || 0}%
              </span>
            </div>

            {/* Modern Progress Bar */}
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${taskStatus?.progress || 0}%` }}
              />
            </div>

            {isCompleted && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Render completed! 100% offline video ready.</span>
              </div>
            )}

            {isFailed && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-medium text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{taskStatus?.error || 'Rendering error occurred'}</span>
              </div>
            )}

            {isCompleted && taskStatus?.download_url && (
              <a
                href={taskStatus.download_url}
                download
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download {taskStatus.output_filename}</span>
              </a>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        {!taskId && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleStartRender}
              disabled={isStarting}
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5" />
                  <span>Start Render</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
