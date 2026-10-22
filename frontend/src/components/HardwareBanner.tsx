import React from 'react';
import { Cpu, Zap, Settings2, CheckCircle2, Wrench } from 'lucide-react';
import { SystemSpecs } from '../types';

interface HardwareBannerProps {
  specs: SystemSpecs | null;
  selectedTier: 'small' | 'medium' | 'large';
  selectedDevice: 'cuda' | 'cpu';
  onOpenTierModal: () => void;
  onOpenSetup: () => void;
}

export const HardwareBanner: React.FC<HardwareBannerProps> = ({
  specs,
  selectedTier,
  selectedDevice,
  onOpenTierModal,
  onOpenSetup,
}) => {
  if (!specs) return null;

  const isRecommended =
    selectedTier === specs.recommended_tier && selectedDevice === specs.recommended_device;

  const tierLabels = {
    small: 'SMALL // LITE',
    medium: 'MEDIUM // BALANCED',
    large: 'LARGE // MAX-ACCURACY',
  };

  return (
    <div className="bg-[#18191B] border-b-2 border-black px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="bg-black text-[#FFE600] font-black px-2 py-0.5 border border-black uppercase tracking-wider text-[11px]">
          [SYS.CORE]
        </span>

        {/* GPU / CPU Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#26282B] text-white border-2 border-black shadow-brutal-sm">
          {specs.has_nvidia ? (
            <>
              <Zap className="w-3.5 h-3.5 text-[#00FF66] fill-[#00FF66]" />
              <span className="font-bold text-[#00FF66]">NVIDIA CUDA</span>
              <span className="text-zinc-400 hidden sm:inline">
                :: {specs.gpu?.name} ({specs.gpu?.vram_total_mb ? Math.round(specs.gpu.vram_total_mb / 1024) : 4}GB)
              </span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="font-bold text-[#00F0FF]">CPU MODE</span>
              <span className="text-zinc-400 hidden sm:inline">
                :: {specs.cpu.physical_cores}C/{specs.cpu.logical_threads}T ({specs.cpu.ram_total_gb}GB)
              </span>
            </>
          )}
        </div>

        {/* Active Tier */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-black text-[#FFE600] border-2 border-[#FFE600] shadow-brutal-sm font-bold">
          <span>TIER:</span>
          <span>{tierLabels[selectedTier]}</span>
          <span className="bg-[#FFE600] text-black px-1 text-[10px] uppercase font-black">
            {selectedDevice}
          </span>
        </div>

        {isRecommended && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00FF66] text-black border-2 border-black font-black uppercase text-[10px] shadow-brutal-sm">
            <CheckCircle2 className="w-3 h-3 stroke-[3]" /> RECOMMENDED SPEC
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onOpenSetup}
          className="btn-brutal bg-[#26282B] hover:bg-[#32353A] text-white px-3 py-1 text-xs flex items-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5 text-[#FFE600]" />
          <span>[SYS.SETUP]</span>
        </button>

        <button
          onClick={onOpenTierModal}
          className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black px-3 py-1 text-xs flex items-center gap-1.5"
        >
          <Settings2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>CONFIG TIERS</span>
        </button>
      </div>
    </div>
  );
};
