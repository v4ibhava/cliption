import React, { useRef, useState } from 'react';
import { UploadCloud, Film, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { UploadedVideo } from '../types';

interface VideoUploaderProps {
  onVideoUploaded: (video: UploadedVideo) => void;
  onBackToSetup: () => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoUploaded,
  onBackToSetup,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|mkv|webm|avi)$/i)) {
      setError('Please choose a valid video file (MP4, MOV, MKV, or WEBM)');
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed (Status: ${response.status})`);
      }

      const data = await response.json();
      onVideoUploaded(data);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Upload Video</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Select a video to crop, reframe, and generate animated captions offline.
          </p>
        </div>

        <button
          onClick={onBackToSetup}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-3 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg border border-zinc-700/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>System Setup</span>
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition-all select-none ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-zinc-800 bg-[#14161b] hover:border-zinc-700 hover:bg-[#181a20]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.mkv,.webm,.avi"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <UploadCloud className="w-10 h-10 stroke-[1.75]" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {isUploading ? 'Uploading and preparing video...' : 'Click to upload or drag and drop'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              MP4, MOV, MKV, or WebM (up to 4K resolution at 60fps)
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-[11px] font-medium border border-zinc-700/50">
              Auto 9:16 Reframe
            </span>
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-[11px] font-medium border border-zinc-700/50">
              Offline Speech AI
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
