import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  Zap,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  Film
} from 'lucide-react';
import { SystemSpecs } from '../types';

interface ModelSetupInfo {
  id: 'small' | 'medium' | 'large';
  name: string;
  model_id: string;
  size: string;
  description: string;
  downloaded: boolean;
  status: string;
  progress: number;
  message: string;
}

interface SetupStatus {
  ffmpeg: {
    installed: boolean;
    version: string | null;
    h264_nvenc: boolean;
    libx264: boolean;
    status: string;
  };
  models: {
    small: ModelSetupInfo;
    medium: ModelSetupInfo;
    large: ModelSetupInfo;
  };
  is_fully_ready: boolean;
}

interface SetupScreenProps {
  specs: SystemSpecs | null;
  selectedTier: 'small' | 'medium' | 'large';
  selectedDevice: 'cuda' | 'cpu';
  onSelectTier: (tier: 'small' | 'medium' | 'large') => void;
  onSelectDevice: (device: 'cuda' | 'cpu') => void;
  onContinue: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  specs,
  selectedTier,
  selectedDevice,
  onSelectTier,
  onSelectDevice,
  onContinue,
}) => {
  const [setupData, setSetupData] = useState<SetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingTier, setDownloadingTier] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/setup/status');
      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
      }
    } catch (e) {
      console.error('Failed to fetch setup status', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadModel = async (tier: string) => {
    setDownloadingTier(tier);
    try {
      await fetch(`/api/setup/download-model/${tier}`, { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error('Download trigger error', e);
    }
  };

  const currentModelDownloaded =
    setupData?.models[selectedTier]?.downloaded || false;

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
          System & Model Setup
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Verify local offline acceleration and choose an AI speech recognition model for video captioning.
        </p>
      </div>

      {/* 1. Hardware & System Acceleration */}
      <div className="bg-[#14161b] border border-zinc-800 rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-medium text-white">Hardware & Acceleration</h2>
              <p className="text-xs text-zinc-400">Detected devices and offline video encoding engines</p>
            </div>
          </div>
          {setupData?.ffmpeg.installed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready & Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> Checking FFmpeg...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* CPU Card */}
          <div className="bg-[#1a1d24] border border-zinc-800/80 rounded-lg p-3.5 space-y-1">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-300" /> Processor (CPU)
            </div>
            <div className="text-sm font-medium text-white truncate">
              {specs?.cpu.name || 'AMD Ryzen / Intel'}
            </div>
            <div className="text-xs text-zinc-500">
              {specs?.cpu.physical_cores || 6} Cores · {specs?.cpu.logical_threads || 12} Threads ({specs?.cpu.ram_total_gb || 16} GB RAM)
            </div>
          </div>

          {/* GPU Card */}
          <div className="bg-[#1a1d24] border border-zinc-800/80 rounded-lg p-3.5 space-y-1">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Graphics (GPU)
            </div>
            <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
              <span>{specs?.gpu?.name || 'Integrated Graphics'}</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              {specs?.has_nvidia ? 'NVIDIA CUDA Acceleration Active' : 'CPU INT8 Mode'}
            </div>
          </div>

          {/* Video Encoder */}
          <div className="bg-[#1a1d24] border border-zinc-800/80 rounded-lg p-3.5 space-y-1">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" /> Video Render Engine
            </div>
            <div className="text-sm font-medium text-white">
              {setupData?.ffmpeg.h264_nvenc ? 'NVIDIA NVENC (GPU)' : 'CPU libx264'}
            </div>
            <div className="text-xs text-zinc-500">
              {setupData?.ffmpeg.version || 'FFmpeg 8.0 Portable'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Offline AI Whisper Models */}
      <div className="bg-[#14161b] border border-zinc-800 rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-medium text-white">AI Speech-to-Text Models</h2>
              <p className="text-xs text-zinc-400">Choose and download offline Whisper models stored on your device</p>
            </div>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            Location: storage/models/
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {setupData &&
            Object.values(setupData.models).map((model) => {
              const isSelected = selectedTier === model.id;
              const isRecommended = specs?.recommended_tier === model.id;
              const isDownloading =
                downloadingTier === model.id || model.status === 'DOWNLOADING';

              return (
                <div
                  key={model.id}
                  onClick={() => onSelectTier(model.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500'
                      : 'border-zinc-800 bg-[#1a1d24] hover:border-zinc-700 hover:bg-[#20242c]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">
                        {model.name}
                      </span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span>Size: {model.size}</span>
                      {model.downloaded ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Downloaded
                        </span>
                      ) : (
                        <span className="text-zinc-500">Not Downloaded</span>
                      )}
                    </div>

                    {isDownloading ? (
                      <div className="w-full py-2 px-3 bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Downloading {model.progress}%...</span>
                      </div>
                    ) : !model.downloaded ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadModel(model.id);
                        }}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Model</span>
                      </button>
                    ) : (
                      <div
                        className={`w-full py-1.5 px-3 text-center text-xs font-medium rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-800/80 text-zinc-300'
                        }`}
                      >
                        {isSelected ? 'Active Model' : 'Select'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-zinc-400">
          Selected: <span className="text-white font-medium capitalize">{selectedTier} Tier</span> ({selectedDevice.toUpperCase()})
        </div>

        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <span>Continue to Video Upload</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
