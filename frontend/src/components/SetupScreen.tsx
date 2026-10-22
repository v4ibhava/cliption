import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Zap,
  Cpu,
  Sparkles,
  ArrowRight,
  HardDrive,
  ShieldCheck,
  Star
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
  caption_packs: Array<{
    id: string;
    name: string;
    font: string;
    colors: string[];
    status: string;
  }>;
  is_fully_ready: boolean;
}

interface SetupScreenProps {
  specs: SystemSpecs | null;
  selectedTier: 'small' | 'medium' | 'large';
  selectedDevice: 'cuda' | 'cpu';
  onSelectTier: (tier: 'small' | 'medium' | 'large') => void;
  onSelectDevice: (device: 'cuda' | 'cpu') => void;
  onCompleteSetup: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  specs,
  selectedTier,
  selectedDevice,
  onSelectTier,
  onSelectDevice,
  onCompleteSetup,
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

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-[#F3F4F6] font-mono p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="max-w-4xl w-full bg-[#18191B] border-4 border-black p-6 md:p-8 shadow-brutal-lg space-y-6">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-black text-[#FFE600] border border-black text-xs font-black uppercase mb-1">
              [SYSTEM SETUP // INITIALIZATION]
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              CLIPTION <span className="text-[#FFE600]">PREREQUISITES & MODELS</span>
            </h1>
            <p className="text-xs text-zinc-400 uppercase mt-0.5">
              Verify local offline tools, download desired Whisper AI models & review caption presets.
            </p>
          </div>

          <button
            onClick={onCompleteSetup}
            className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black px-5 py-2.5 text-xs flex items-center gap-2"
          >
            <span>ENTER STUDIO</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Section 1: FFmpeg & Video Encoders */}
        <div className="bg-[#1F2023] border-2 border-black p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-[#FFE600]" />
              <span className="text-xs font-black uppercase text-white">
                // 1. FFMPEG & HARDWARE VIDEO ENCODERS
              </span>
            </div>
            {setupData?.ffmpeg.installed ? (
              <span className="bg-[#00FF66] text-black border border-black text-[10px] font-black px-2 py-0.5 uppercase shadow-brutal-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" /> READY & VERIFIED
              </span>
            ) : (
              <span className="bg-[#FF3366] text-black border border-black text-[10px] font-black px-2 py-0.5 uppercase">
                MISSING
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="bg-black border border-black p-2">
              <div className="text-zinc-500 uppercase font-bold text-[9px]">ENGINE</div>
              <div className="font-bold text-white truncate">{setupData?.ffmpeg.version || 'FFmpeg Portable 8.0'}</div>
            </div>

            <div className="bg-black border border-black p-2">
              <div className="text-zinc-500 uppercase font-bold text-[9px]">NVIDIA HARDWARE ACCELERATION</div>
              <div className="font-bold flex items-center gap-1 text-[#00FF66]">
                <Zap className="w-3 h-3 fill-current" />
                {setupData?.ffmpeg.h264_nvenc ? 'NVENC (h264_nvenc) READY' : 'NOT DETECTED'}
              </div>
            </div>

            <div className="bg-black border border-black p-2">
              <div className="text-zinc-500 uppercase font-bold text-[9px]">CPU ENCODER</div>
              <div className="font-bold flex items-center gap-1 text-[#00F0FF]">
                <Cpu className="w-3 h-3" />
                {setupData?.ffmpeg.libx264 ? 'libx264 (veryfast) READY' : 'NOT DETECTED'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: AI Whisper Model Tiers */}
        <div className="bg-[#1F2023] border-2 border-black p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#FFE600]" />
              <span className="text-xs font-black uppercase text-white">
                // 2. OFFLINE SPEECH-TO-TEXT AI MODELS (CHOOSE & DOWNLOAD)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase">
              STORED IN: storage/models/
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {setupData &&
              Object.values(setupData.models).map((model) => {
                const isSelected = selectedTier === model.id;
                const isRecommended = specs?.recommended_tier === model.id;
                const isDownloading = downloadingTier === model.id || model.status === 'DOWNLOADING';

                return (
                  <div
                    key={model.id}
                    onClick={() => onSelectTier(model.id)}
                    className={`p-3 border-2 border-black cursor-pointer transition select-none flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#26282B] border-[#FFE600] shadow-brutal-yellow'
                        : 'bg-black hover:bg-[#161719]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-white uppercase">{model.name}</span>
                        {isRecommended && (
                          <span className="px-1.5 py-0.2 bg-[#00FF66] text-black border border-black text-[9px] font-black uppercase flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-black" /> REC
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#FFE600] font-black uppercase mb-1.5">
                        DOWNLOAD SIZE: {model.size}
                      </div>

                      <p className="text-[10px] text-zinc-300 leading-snug mb-3">{model.description}</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800">
                      {model.downloaded ? (
                        <div className="flex items-center justify-between text-[10px] font-black text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/40 px-2 py-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 stroke-[3]" /> READY OFFLINE
                          </span>
                          {isSelected && <span>[ACTIVE]</span>}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadModel(model.id);
                          }}
                          disabled={isDownloading}
                          className="btn-brutal w-full py-1.5 bg-[#FFE600] hover:bg-[#FFF066] text-black text-[10px] font-black flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin stroke-[3]" />
                              <span>DOWNLOADING...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 stroke-[2.5]" />
                              <span>DOWNLOAD ({model.size})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Section 3: Caption Design Packs & Fonts */}
        <div className="bg-[#1F2023] border-2 border-black p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFE600]" />
              <span className="text-xs font-black uppercase text-white">
                // 3. VIRAL CAPTION PACKS & CREATOR FONTS
              </span>
            </div>
            <span className="bg-[#00FF66] text-black border border-black text-[10px] font-black px-2 py-0.5 uppercase shadow-brutal-sm">
              ALL PACKS INSTALLED
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {setupData?.caption_packs.map((pack) => (
              <div key={pack.id} className="bg-black border border-black p-2">
                <div className="font-bold text-white text-[11px] truncate">{pack.name}</div>
                <div className="flex items-center justify-between mt-1 text-[9px] text-zinc-400">
                  <span>FONT: {pack.font}</span>
                  <div className="flex items-center gap-1">
                    {pack.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 border border-black inline-block"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Enter Action */}
        <div className="pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Current Tier: <strong className="text-white uppercase">{selectedTier}</strong> • Compute:{' '}
            <strong className="text-[#FFE600] uppercase">{selectedDevice}</strong>
          </div>

          <button
            onClick={onCompleteSetup}
            className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black px-8 py-3 text-sm font-black flex items-center gap-2 shadow-brutal"
          >
            <span>LAUNCH CLIPTION STUDIO</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};

