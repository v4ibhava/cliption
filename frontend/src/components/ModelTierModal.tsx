import React from 'react';
import { X, Cpu, Zap, Check, Star, ShieldCheck } from 'lucide-react';
import { SystemSpecs } from '../types';

interface ModelTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: SystemSpecs | null;
  selectedTier: 'small' | 'medium' | 'large';
  selectedDevice: 'cuda' | 'cpu';
  onSelectTier: (tier: 'small' | 'medium' | 'large') => void;
  onSelectDevice: (device: 'cuda' | 'cpu') => void;
}

export const ModelTierModal: React.FC<ModelTierModalProps> = ({
  isOpen,
  onClose,
  specs,
  selectedTier,
  selectedDevice,
  onSelectTier,
  onSelectDevice,
}) => {
  if (!isOpen || !specs) return null;

  const tiers: {
    id: 'small' | 'medium' | 'large';
    name: string;
    subtitle: string;
    description: string;
    ramUsage: string;
    speed: string;
    model: string;
  }[] = [
    {
      id: 'small',
      name: 'TIER 01: SMALL',
      subtitle: 'FAST / LOW-END PC',
      description: 'Zero lag on budget dual-core / quad-core CPUs. INT8 quantized inference engine.',
      ramUsage: '~300 MB',
      speed: '⚡⚡⚡ INSTANT',
      model: 'Whisper Base (Quantized)',
    },
    {
      id: 'medium',
      name: 'TIER 02: MEDIUM',
      subtitle: 'BALANCED ACCURACY',
      description: 'Standard laptops and balanced multilingual transcription with high nuance retention.',
      ramUsage: '~1 GB',
      speed: '⚡⚡ VERY FAST',
      model: 'Whisper Small',
    },
    {
      id: 'large',
      name: 'TIER 03: LARGE',
      subtitle: 'MAXIMUM PRECISION',
      description: 'State-of-the-art multilingual transcriptions, complex accents, background audio isolation.',
      ramUsage: '~2-3 GB',
      speed: '⚡ ULTRA-SMOOTH ON CUDA',
      model: 'Whisper Large v3 Turbo',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-fade-in font-mono">
      <div className="bg-[#18191B] border-4 border-black max-w-2xl w-full p-6 shadow-brutal-lg relative text-white">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#FFE600] border border-black inline-block" />
            <h2 className="text-base font-black uppercase tracking-wider text-[#FFE600]">
              [HARDWARE // MODEL CONFIG]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#26282B] border-2 border-black hover:bg-black text-white hover:text-[#FFE600] transition"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Hardware Status Box */}
        <div className="p-3 bg-black border-2 border-black mb-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              CPU SYSTEM INFO
            </div>
            <div className="font-bold text-white mt-0.5 truncate">{specs.cpu.name}</div>
            <div className="text-zinc-400 text-[11px]">
              {specs.cpu.physical_cores} CORES / {specs.cpu.logical_threads} THREADS :: {specs.cpu.ram_total_gb} GB RAM
            </div>
          </div>

          {specs.has_nvidia && (
            <div className="border-t md:border-t-0 md:border-l border-zinc-800 md:pl-3">
              <div className="text-[10px] uppercase font-bold text-[#00FF66] tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-[#00FF66]" /> NVIDIA GPU DETECTED
              </div>
              <div className="font-bold text-white mt-0.5 truncate">{specs.gpu?.name}</div>
              <div className="text-zinc-400 text-[11px]">
                {specs.gpu?.vram_total_mb} MB VRAM (DRIVER: {specs.gpu?.driver_version || 'ACTIVE'})
              </div>
            </div>
          )}
        </div>

        {/* Device Selection (GPU vs CPU) */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            // ACCELERATION DEVICE
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectDevice('cuda')}
              disabled={!specs.has_nvidia}
              className={`p-3 border-2 border-black text-left transition select-none ${
                selectedDevice === 'cuda'
                  ? 'bg-[#00FF66] text-black font-bold shadow-brutal'
                  : specs.has_nvidia
                  ? 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
                  : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-current" />
                  <span className="font-black text-xs">NVIDIA CUDA</span>
                </div>
                {selectedDevice === 'cuda' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="text-[10px] mt-1 opacity-90">Tensor acceleration + NVENC</div>
            </button>

            <button
              onClick={() => onSelectDevice('cpu')}
              className={`p-3 border-2 border-black text-left transition select-none ${
                selectedDevice === 'cpu'
                  ? 'bg-[#FFE600] text-black font-bold shadow-brutal'
                  : 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span className="font-black text-xs">CPU (INT8)</span>
                </div>
                {selectedDevice === 'cpu' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="text-[10px] mt-1 opacity-90">Low-end fallback & universal</div>
            </button>
          </div>
        </div>

        {/* 3 Tiers Options */}
        <div className="space-y-2.5 mb-5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            // MODEL TIER SELECTION
          </label>

          {tiers.map((t) => {
            const isSelected = selectedTier === t.id;
            const isRecommended = specs.recommended_tier === t.id;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTier(t.id)}
                className={`p-3 border-2 border-black cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-[#26282B] border-2 border-[#FFE600] shadow-brutal-yellow'
                    : 'bg-[#1F2023] hover:bg-[#26282B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-white">{t.name}</span>
                    <span className="text-[10px] text-zinc-400 uppercase">[{t.subtitle}]</span>
                    {isRecommended && (
                      <span className="px-1.5 py-0.2 bg-[#00FF66] text-black border border-black text-[9px] font-black uppercase">
                        ★ RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="w-4 h-4 border-2 border-black bg-black flex items-center justify-center">
                    {isSelected && <div className="w-2 h-2 bg-[#FFE600]" />}
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 mb-2">{t.description}</p>

                <div className="flex items-center gap-4 text-[10px] text-zinc-400 border-t border-zinc-800 pt-1">
                  <span>RAM: <strong className="text-white">{t.ramUsage}</strong></span>
                  <span>SPEED: <strong className="text-white">{t.speed}</strong></span>
                  <span>MODEL: <strong className="text-white">{t.model}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t-2 border-black">
          <button
            onClick={onClose}
            className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black px-6 py-2 text-xs"
          >
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
