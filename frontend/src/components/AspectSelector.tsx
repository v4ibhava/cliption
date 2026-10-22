import React from 'react';
import { Smartphone, Square, Tv, Move, Sliders, ZoomIn, RotateCcw, Maximize, Minimize, Wind } from 'lucide-react';
import { CropConfig, AspectRatioType, FitModeType } from '../types';

interface AspectSelectorProps {
  crop: CropConfig;
  onChange: (updated: Partial<CropConfig>) => void;
}

export const AspectSelector: React.FC<AspectSelectorProps> = ({ crop, onChange }) => {
  const ratios: { id: AspectRatioType; label: string; icon: any; desc: string }[] = [
    { id: '9:16', label: '9:16 VERTICAL', icon: Smartphone, desc: 'SHORTS / REELS' },
    { id: '1:1', label: '1:1 SQUARE', icon: Square, desc: 'FEED / POSTS' },
    { id: '4:5', label: '4:5 PORTRAIT', icon: Smartphone, desc: 'IG PORTRAIT' },
    { id: '16:9', label: '16:9 STANDARD', icon: Tv, desc: 'YOUTUBE' },
  ];

  const fitModes: { id: FitModeType; label: string; desc: string }[] = [
    { id: 'blur_background', label: 'BLUR BG', desc: 'Preserves full video + blur' },
    { id: 'crop', label: 'FILL & PAN', desc: 'Custom zoom & pan framing' },
    { id: 'fit', label: 'LETTERBOX', desc: 'Solid black borders' },
  ];

  // Default zoom is 3.16 (full vertical cover for 16:9 in 9:16)
  const currentZoom = crop.zoom !== undefined ? crop.zoom : 3.16;

  const getMotionBlurLabel = (val: number) => {
    if (val <= 30) return 'SUBTLE (90° SHUTTER)';
    if (val <= 60) return 'CINEMATIC (180° SHUTTER)';
    if (val <= 85) return 'ACTION (270° SHUTTER)';
    return 'EXTREME (360° SHUTTER)';
  };

  const mbIntensity = crop.motion_blur_intensity !== undefined ? crop.motion_blur_intensity : 50;

  return (
    <div className="bg-[#18191B] border-2 border-black p-4 space-y-4 shadow-brutal font-mono">
      {/* Target Aspect Ratio */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-[#FFE600] inline-block" />
          <label className="text-[11px] font-black uppercase text-zinc-300 tracking-wider">
            // ASPECT RATIO PRESET
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ratios.map((r) => {
            const Icon = r.icon;
            const isSelected = crop.aspect_ratio === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onChange({ aspect_ratio: r.id })}
                className={`p-2.5 border-2 border-black text-left transition select-none ${
                  isSelected
                    ? 'bg-[#FFE600] text-black font-black shadow-brutal'
                    : 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="text-xs font-black">{r.label}</span>
                </div>
                <div className="text-[9px] uppercase opacity-80">{r.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reframe Mode */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-[#00FF66] inline-block" />
          <label className="text-[11px] font-black uppercase text-zinc-300 tracking-wider">
            // REFRAME MODE
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {fitModes.map((m) => {
            const isSelected = crop.fit_mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChange({ fit_mode: m.id })}
                className={`p-2 border-2 border-black text-left transition select-none ${
                  isSelected
                    ? 'bg-[#00FF66] text-black font-black shadow-brutal-sm'
                    : 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
                }`}
              >
                <div className="text-[11px] font-black">{m.label}</div>
                <div className="text-[8px] uppercase opacity-75">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fill & Pan Adjustments: Pan X & Zoom Scale */}
      {crop.fit_mode === 'crop' && (
        <div className="p-3 bg-black border-2 border-black space-y-3">
          {/* Horizontal Pan */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#FFE600]" /> HORIZONTAL PAN
              </span>
              <span className="text-[#FFE600]">{Math.round(crop.pan_x * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={crop.pan_x}
              onChange={(e) => onChange({ pan_x: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#26282B] border border-black appearance-none cursor-pointer accent-[#FFE600]"
            />
          </div>

          {/* Zoom Scale (1.0x Full Scene to 3.2x Full Fill) */}
          <div className="border-t border-zinc-800 pt-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-[#00FF66]" /> ZOOM SCALE
              </span>
              <span className="text-[#00FF66] font-bold">
                {currentZoom <= 1.05
                  ? 'FULL SCENE (1.0X)'
                  : currentZoom >= 3.1
                  ? 'FILL SCREEN (3.2X)'
                  : `${currentZoom.toFixed(1)}X`}
              </span>
            </div>

            <input
              type="range"
              min={1.0}
              max={3.2}
              step={0.05}
              value={currentZoom}
              onChange={(e) => onChange({ zoom: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#26282B] border border-black appearance-none cursor-pointer accent-[#00FF66]"
            />

            {/* Quick Framing Presets */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onChange({ zoom: 1.0 })}
                className={`py-1 px-2 border border-black text-[9px] font-black uppercase flex items-center justify-center gap-1 transition ${
                  currentZoom <= 1.05
                    ? 'bg-[#00FF66] text-black shadow-brutal-sm'
                    : 'bg-[#26282B] text-zinc-300 hover:text-white'
                }`}
              >
                <Minimize className="w-3 h-3" />
                <span>UNCROPPED (1.0X)</span>
              </button>

              <button
                onClick={() => onChange({ zoom: 3.16 })}
                className={`py-1 px-2 border border-black text-[9px] font-black uppercase flex items-center justify-center gap-1 transition ${
                  currentZoom >= 3.1
                    ? 'bg-[#FFE600] text-black shadow-brutal-sm'
                    : 'bg-[#26282B] text-zinc-300 hover:text-white'
                }`}
              >
                <Maximize className="w-3 h-3" />
                <span>FILL SCREEN (3.2X)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blur Background Intensity */}
      {crop.fit_mode === 'blur_background' && (
        <div className="p-3 bg-black border-2 border-black space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00FF66]" /> BG BLUR INTENSITY
            </span>
            <span className="text-[#00FF66]">{crop.blur_intensity} PX</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={crop.blur_intensity}
            onChange={(e) => onChange({ blur_intensity: parseInt(e.target.value) })}
            className="w-full h-2 bg-[#26282B] border border-black appearance-none cursor-pointer accent-[#00FF66]"
          />
        </div>
      )}

      {/* Motion Blur (RSMB / 180° Shutter Simulation) */}
      <div className="pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00F0FF] inline-block" />
            <label className="text-[11px] font-black uppercase text-zinc-300 tracking-wider">
              // MOTION BLUR (RSMB)
            </label>
          </div>
          <span
            className={`px-1.5 py-0.5 text-[9px] font-black uppercase border border-black ${
              crop.motion_blur
                ? 'bg-[#00F0FF] text-black shadow-brutal-sm'
                : 'bg-[#26282B] text-zinc-400'
            }`}
          >
            {crop.motion_blur ? 'ACTIVE' : 'OFF'}
          </span>
        </div>

        <button
          onClick={() => onChange({ motion_blur: !crop.motion_blur })}
          className={`w-full py-2 px-3 border-2 border-black text-xs font-black uppercase transition flex items-center justify-center gap-2 select-none ${
            crop.motion_blur
              ? 'bg-[#00F0FF] text-black shadow-brutal'
              : 'bg-[#26282B] text-zinc-300 hover:bg-[#32353A]'
          }`}
        >
          <Wind className="w-4 h-4 stroke-[2.5]" />
          <span>{crop.motion_blur ? 'MOTION BLUR: ENABLED' : 'ENABLE MOTION BLUR'}</span>
        </button>

        {crop.motion_blur && (
          <div className="p-3 bg-black border-2 border-black space-y-2 mt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" /> BLUR INTENSITY
              </span>
              <span className="text-[#00F0FF] font-black">
                {mbIntensity}% - {getMotionBlurLabel(mbIntensity)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={mbIntensity}
              onChange={(e) => onChange({ motion_blur_intensity: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#26282B] border border-black appearance-none cursor-pointer accent-[#00F0FF]"
            />

            {/* Quick Motion Blur Intensity Presets */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: '90° SUBTLE', val: 25 },
                { label: '180° CINEMA', val: 50 },
                { label: '270° ACTION', val: 75 },
                { label: '360° MAX', val: 100 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => onChange({ motion_blur_intensity: p.val })}
                  className={`py-1 border border-black text-[8px] font-black uppercase transition ${
                    mbIntensity === p.val
                      ? 'bg-[#00F0FF] text-black shadow-brutal-sm'
                      : 'bg-[#26282B] text-zinc-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-zinc-400 pt-1 leading-tight">
              ReelSmart Motion Blur (RSMB) emulation. Smooths fast camera pans and mouse flicks without strobe ghosting or degrading 60 FPS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
