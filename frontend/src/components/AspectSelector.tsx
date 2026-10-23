import React from 'react';
import { Smartphone, Square, Tv, Move, Sliders, ZoomIn, Maximize, Minimize, Layers } from 'lucide-react';
import { CropConfig, AspectRatioType } from '../types';

interface AspectSelectorProps {
  crop: CropConfig;
  onChange: (updated: Partial<CropConfig>) => void;
}

export const AspectSelector: React.FC<AspectSelectorProps> = ({ crop, onChange }) => {
  const ratios: { id: AspectRatioType; label: string; icon: any; desc: string }[] = [
    { id: '9:16', label: '9:16 Vertical', icon: Smartphone, desc: 'Shorts / Reels / TikTok' },
    { id: '1:1', label: '1:1 Square', icon: Square, desc: 'Instagram Feed' },
    { id: '4:5', label: '4:5 Portrait', icon: Smartphone, desc: 'IG Portrait' },
    { id: '16:9', label: '16:9 Landscape', icon: Tv, desc: 'YouTube Standard' },
  ];

  // Default zoom is 3.16 (full vertical cover for 16:9 in 9:16)
  const currentZoom = crop.zoom !== undefined ? crop.zoom : (crop.fit_mode === 'blur_background' ? 1.0 : 3.16);
  const isBlurEnabled = crop.fit_mode === 'blur_background';

  return (
    <div className="bg-[#14161b] border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Target Aspect Ratio */}
      <div>
        <label className="text-xs font-medium text-zinc-300 block mb-2">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ratios.map((r) => {
            const Icon = r.icon;
            const isSelected = crop.aspect_ratio === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onChange({ aspect_ratio: r.id })}
                className={`p-2.5 rounded-lg border text-left transition select-none ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium ring-1 ring-indigo-500/50'
                    : 'border-zinc-800 bg-[#1a1d24] text-zinc-400 hover:text-zinc-200 hover:bg-[#20242c]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="text-xs font-semibold text-white">{r.label}</span>
                </div>
                <div className="text-[10px] text-zinc-400">{r.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Framing: Zoom Scale & Horizontal Pan (Always Active) */}
      <div className="p-3.5 bg-[#1a1d24] border border-zinc-800 rounded-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Framing & Position</span>
          </label>
          <span className="text-[11px] font-semibold text-indigo-400">
            {currentZoom <= 1.05
              ? 'Fit Full Scene (1.0x)'
              : currentZoom >= 3.1
              ? 'Fill Screen (3.2x)'
              : `${currentZoom.toFixed(1)}x Zoom`}
          </span>
        </div>

        {/* Zoom Scale Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Zoom Scale</span>
            <span className="font-mono text-zinc-300">{currentZoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={3.2}
            step={0.05}
            value={currentZoom}
            onChange={(e) => onChange({ zoom: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onChange({ zoom: 1.0 })}
              className={`py-1.5 px-2 rounded-md border text-[11px] font-medium flex items-center justify-center gap-1.5 transition ${
                currentZoom <= 1.05
                  ? 'border-indigo-500 bg-indigo-500/15 text-white'
                  : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:text-white'
              }`}
            >
              <Minimize className="w-3 h-3" />
              <span>Fit Scene (1.0x)</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ zoom: 3.16 })}
              className={`py-1.5 px-2 rounded-md border text-[11px] font-medium flex items-center justify-center gap-1.5 transition ${
                currentZoom >= 3.1
                  ? 'border-indigo-500 bg-indigo-500/15 text-white'
                  : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:text-white'
              }`}
            >
              <Maximize className="w-3 h-3" />
              <span>Fill Screen (3.2x)</span>
            </button>
          </div>
        </div>

        {/* Horizontal Pan */}
        <div className="border-t border-zinc-800/80 pt-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-zinc-400" /> Horizontal Pan
            </span>
            <span className="text-indigo-400 font-semibold">{Math.round(crop.pan_x * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={crop.pan_x}
            onChange={(e) => onChange({ pan_x: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Background Fill Feature (Blur vs Solid Black) */}
      <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Background Blur</span>
            </label>
            <span className="text-[10px] text-zinc-500 block">
              {isBlurEnabled ? 'Blurred video fills uncovered bars' : 'Clean black letterbox bars'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ fit_mode: isBlurEnabled ? 'crop' : 'blur_background' })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              isBlurEnabled
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isBlurEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Blur Intensity Slider appears only when blur is enabled */}
        {isBlurEnabled && (
          <div className="p-3 bg-[#1a1d24] border border-zinc-800 rounded-lg space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Sliders className="w-3.5 h-3.5 text-zinc-400" /> Blur Intensity
              </span>
              <span className="text-indigo-400 font-semibold">{crop.blur_intensity || 25} px</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={crop.blur_intensity || 25}
              onChange={(e) => onChange({ blur_intensity: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {[
                { label: 'Subtle', val: 12 },
                { label: 'Standard', val: 25 },
                { label: 'Deep Blur', val: 42 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => onChange({ blur_intensity: p.val })}
                  className={`py-1 rounded border text-[10px] font-medium transition ${
                    (crop.blur_intensity || 25) === p.val
                      ? 'border-indigo-500 bg-indigo-500/15 text-white'
                      : 'border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
