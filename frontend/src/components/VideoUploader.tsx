import React, { useRef, useState } from 'react';
import { UploadCloud, Film, AlertCircle, Loader2 } from 'lucide-react';
import { UploadedVideo } from '../types';

interface VideoUploaderProps {
  onVideoUploaded: (video: UploadedVideo) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|mkv|webm|avi)$/i)) {
      setError('INVALID FILE TYPE: Please choose MP4, MOV, MKV, or WEBM');
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
        throw new Error(`UPLOAD FAILED (STATUS: ${response.status})`);
      }

      const data = await response.json();
      onVideoUploaded(data);
    } catch (err: any) {
      setError(err.message || 'UPLOAD PIPELINE FAILED');
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
    <div className="w-full max-w-2xl mx-auto p-4 font-mono">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-4 border-dashed p-10 text-center cursor-pointer transition-all select-none ${
          isDragging
            ? 'border-[#FFE600] bg-[#26282B] shadow-brutal-yellow'
            : 'border-black hover:border-[#FFE600] bg-[#18191B] shadow-brutal-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="w-20 h-20 bg-[#FFE600] text-black border-4 border-black flex items-center justify-center mx-auto mb-5 shadow-brutal">
          {isUploading ? (
            <Loader2 className="w-10 h-10 animate-spin stroke-[2.5]" />
          ) : (
            <UploadCloud className="w-10 h-10 stroke-[2.5]" />
          )}
        </div>

        <div className="inline-block bg-black text-[#FFE600] px-2 py-0.5 border border-black uppercase text-xs font-black tracking-wider mb-2">
          [DROP ZONE // INPUT]
        </div>

        <h3 className="text-xl font-black uppercase text-white mb-2 tracking-tight">
          {isUploading ? 'IMPORTING & PROBING AUDIO...' : 'IMPORT RAW VIDEO FILE'}
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
          DROP VIDEO ANYWHERE OR CLICK TO BROWSE. SUPPORTS 16:9, 4:3, 9:16 (MP4, MOV, MKV, WEBM).
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-bold text-black bg-[#00FF66] px-3 py-1 border-2 border-black shadow-brutal-sm">
          <Film className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>AUTO-REFRAME TO 9:16 SHORTS / REELS + ANIMATED CAPTIONS</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-[#FF3366] text-black border-2 border-black shadow-brutal font-bold text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 stroke-[3]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
