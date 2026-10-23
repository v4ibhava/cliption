import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Type, Palette, MoveVertical, Check, Eye, MousePointer, GripHorizontal } from 'lucide-react';
import { CaptionStyle } from '../types';

interface CaptionStylerProps {
  style: CaptionStyle;
  onChange: (updated: Partial<CaptionStyle>) => void;
}

export const CaptionStyler: React.FC<CaptionStylerProps> = ({ style, onChange }) => {
  const [activeWordDemoIdx, setActiveWordDemoIdx] = useState(1);
  const sampleWords = ['Clean', 'Viral', 'Captions'];
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const calculatePctFromEvent = (clientX: number): number => {
    if (!trackRef.current) return style.position_vertical;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return style.position_vertical;
    const relativeX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawPct = Math.round(18 + relativeX * (88 - 18));
    return Math.max(18, Math.min(88, rawPct));
  };

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    const newPct = calculatePctFromEvent(e.clientX);
    onChange({ position_vertical: newPct });

    const onMove = (moveEv: MouseEvent) => {
      const draggedPct = calculatePctFromEvent(moveEv.clientX);
      onChange({ position_vertical: draggedPct });
    };

    const onUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pct = calculatePctFromEvent(e.clientX);
    setHoverPct(pct);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? -2 : 2;
    const nextVal = Math.max(18, Math.min(88, style.position_vertical + delta));
    onChange({ position_vertical: nextVal });
  };

  // Animate demo words in the preview box
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWordDemoIdx((prev) => (prev + 1) % sampleWords.length);
    }, 900);
    return () => clearInterval(timer);
  }, [sampleWords.length]);

  const presets = [
    {
      id: 'mrbeast',
      name: 'MrBeast',
      tag: 'Bold Yellow',
      sample: { first: 'MAKE IT', highlight: 'VIRAL' },
      font: 'Impact',
      primary: '#FFFFFF',
      highlight: '#FFE600',
      outline: '#000000',
      outlineWidth: 4,
      shadowDepth: 2,
      uppercase: true,
      animation: 'karaoke',
    },
    {
      id: 'hormozi',
      name: 'Hormozi',
      tag: 'Neon Lime',
      sample: { first: 'SCALE', highlight: 'FASTER' },
      font: 'Montserrat',
      primary: '#FFFFFF',
      highlight: '#00FF66',
      outline: '#000000',
      outlineWidth: 4,
      shadowDepth: 3,
      uppercase: true,
      animation: 'karaoke',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      tag: 'Clean Aesthetic',
      sample: { first: 'clean', highlight: 'aesthetic' },
      font: 'Inter',
      primary: '#F8FAFC',
      highlight: '#38BDF8',
      outline: '#000000',
      outlineWidth: 2,
      shadowDepth: 1,
      uppercase: false,
      animation: 'karaoke',
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      tag: 'Cyan / Magenta',
      sample: { first: 'FUTURE', highlight: 'NEON' },
      font: 'Anton',
      primary: '#FFFFFF',
      highlight: '#00F0FF',
      outline: '#7000FF',
      outlineWidth: 4,
      shadowDepth: 3,
      uppercase: true,
      animation: 'karaoke',
    },
  ];

  const applyPreset = (preset: (typeof presets)[0]) => {
    onChange({
      preset_name: preset.id,
      font_family: preset.font,
      primary_color: preset.primary,
      highlight_color: preset.highlight,
      outline_color: preset.outline,
      outline_width: preset.outlineWidth,
      shadow_depth: preset.shadowDepth,
      uppercase: preset.uppercase,
      animation_style: preset.animation as any,
    });
  };

  return (
    <div className="bg-[#14161b] border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Presets Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-300">
            Caption Style Presets
          </label>
          <span className="text-[10px] text-zinc-400">
            Click to apply
          </span>
        </div>

        {/* 4 Preset Cards */}
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => {
            const isSelected = style.preset_name === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`p-2.5 rounded-lg border text-left transition select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500/50'
                    : 'border-zinc-800 bg-[#1a1d24] text-zinc-400 hover:text-zinc-200 hover:bg-[#20242c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white">{p.name}</span>
                  {isSelected && (
                    <div className="w-3.5 h-3.5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Rendered Visual Mini-Preview */}
                <div className="bg-black/60 rounded p-1.5 text-center my-1 select-none overflow-hidden border border-zinc-800/60">
                  <div
                    style={{ fontFamily: p.font }}
                    className="text-xs font-bold tracking-wide leading-tight"
                  >
                    <span
                      style={{
                        color: p.primary,
                        WebkitTextStroke: `${Math.max(1, p.outlineWidth / 2)}px ${p.outline}`,
                        textShadow: `${p.shadowDepth}px ${p.shadowDepth}px 0px black`,
                      }}
                    >
                      {p.uppercase ? p.sample.first.toUpperCase() : p.sample.first}{' '}
                    </span>
                    <span
                      style={{
                        color: p.highlight,
                        WebkitTextStroke: `${Math.max(1, p.outlineWidth / 2)}px ${p.outline}`,
                        textShadow: `${p.shadowDepth}px ${p.shadowDepth}px 0px black`,
                      }}
                    >
                      {p.uppercase ? p.sample.highlight.toUpperCase() : p.sample.highlight}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {p.tag}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Active Style Demo Banner */}
      <div className="bg-[#1a1d24] border border-zinc-800 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
            <Eye className="w-3.5 h-3.5" /> Style Preview
          </span>
          <span className="text-[10px] text-zinc-400">{style.font_family} · {style.font_size}px</span>
        </div>

        {/* Animated Text Box */}
        <div className="py-2.5 px-3 bg-black/60 border border-zinc-800/80 text-center rounded-lg overflow-hidden">
          <div
            style={{ fontFamily: style.font_family }}
            className="font-bold tracking-wide flex items-center justify-center gap-2 select-none"
          >
            {sampleWords.map((word, i) => {
              const isActive = i === activeWordDemoIdx;
              const displayText = style.uppercase ? word.toUpperCase() : word;

              return (
                <span
                  key={i}
                  className={`inline-block transition-transform duration-100 ${
                    isActive ? 'scale-110 font-bold' : 'scale-100 opacity-90'
                  }`}
                  style={{
                    fontSize: `${Math.max(16, Math.min(24, style.font_size * 0.65))}px`,
                    color: isActive ? style.highlight_color : style.primary_color,
                    WebkitTextStroke: `${Math.max(1, style.outline_width / 2)}px ${style.outline_color}`,
                    textShadow: `${style.shadow_depth * 1.5}px ${style.shadow_depth * 1.5}px 0px ${style.shadow_color}`,
                    paintOrder: 'stroke fill',
                  }}
                >
                  {displayText}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Typography & Animation Selectors */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Font Family</label>
          <select
            value={style.font_family}
            onChange={(e) => onChange({ font_family: e.target.value, preset_name: 'custom' })}
            className="w-full bg-[#1a1d24] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="Impact">Impact (Classic Bold)</option>
            <option value="Montserrat">Montserrat (Modern Clean)</option>
            <option value="Anton">Anton (Tall Heavy)</option>
            <option value="Bebas Neue">Bebas Neue (Condensed)</option>
            <option value="Arial">Arial Black</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Animation</label>
          <select
            value={style.animation_style}
            onChange={(e) => onChange({ animation_style: e.target.value as any })}
            className="w-full bg-[#1a1d24] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="karaoke">Karaoke Highlight</option>
            <option value="word_by_word">Word by Word</option>
            <option value="none">Static Block</option>
          </select>
        </div>
      </div>

      {/* Colors & Toggles */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Highlight Color</label>
          <div className="flex items-center gap-1.5 bg-[#1a1d24] border border-zinc-800 rounded-lg px-2 py-1">
            <input
              type="color"
              value={style.highlight_color}
              onChange={(e) => onChange({ highlight_color: e.target.value, preset_name: 'custom' })}
              className="w-4 h-4 cursor-pointer border-0 bg-transparent rounded"
            />
            <span className="text-[10px] text-zinc-300 uppercase truncate">
              {style.highlight_color}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Text Color</label>
          <div className="flex items-center gap-1.5 bg-[#1a1d24] border border-zinc-800 rounded-lg px-2 py-1">
            <input
              type="color"
              value={style.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value, preset_name: 'custom' })}
              className="w-4 h-4 cursor-pointer border-0 bg-transparent rounded"
            />
            <span className="text-[10px] text-zinc-300 uppercase truncate">
              {style.primary_color}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={() => onChange({ uppercase: !style.uppercase })}
            className={`w-full py-1.5 px-2 rounded-lg border text-[11px] font-medium transition select-none ${
              style.uppercase
                ? 'border-indigo-500 bg-indigo-500/15 text-white'
                : 'border-zinc-800 bg-[#1a1d24] text-zinc-400'
            }`}
          >
            {style.uppercase ? 'ALL CAPS' : 'Normal Case'}
          </button>
        </div>
      </div>

      {/* Vertical Position & Font Size */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <MoveVertical className="w-3.5 h-3.5 text-indigo-400" /> Vertical Position
            </span>
            <div className="flex items-center gap-1.5">
              {hoverPct !== null && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  Hover: {hoverPct}%
                </span>
              )}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {style.position_vertical}%
              </span>
            </div>
          </div>

          {/* Quick Position Snap Presets */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[
              { label: 'Top', val: 26 },
              { label: 'Center', val: 50 },
              { label: 'Bottom', val: 84 },
            ].map((p) => {
              const isSelected = Math.abs(style.position_vertical - p.val) <= 4;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange({ position_vertical: p.val })}
                  className={`py-1 text-[11px] font-medium rounded-md border transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-sm'
                      : 'border-zinc-800 bg-[#1a1d24] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {p.label} ({p.val}%)
                </button>
              );
            })}
          </div>

          {/* Interactive Mouse Hover & Drag Scrub Track */}
          <div
            ref={trackRef}
            onMouseDown={handleTrackMouseDown}
            onMouseMove={handleTrackMouseMove}
            onMouseLeave={() => setHoverPct(null)}
            onWheel={handleWheel}
            className={`relative h-8 bg-[#1a1d24] border rounded-lg cursor-ew-resize flex items-center px-3 group transition-all select-none overflow-hidden ${
              isScrubbing ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-zinc-800 hover:border-indigo-500/50'
            }`}
            title="Hover or drag mouse to adjust vertical position (or use scroll wheel)"
          >
            {/* Active filled area */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 pointer-events-none transition-all duration-75"
              style={{
                width: `${Math.max(0, Math.min(100, ((style.position_vertical - 18) / (88 - 18)) * 100))}%`,
              }}
            />

            {/* Hover Ghost Indicator */}
            {hoverPct !== null && (
              <div
                className="absolute top-1 bottom-1 w-0.5 bg-indigo-400/40 pointer-events-none transition-all duration-75"
                style={{
                  left: `${Math.max(0, Math.min(100, ((hoverPct - 18) / (88 - 18)) * 100))}%`,
                }}
              />
            )}

            {/* Position Thumb / Line */}
            <div
              className="absolute top-1.5 bottom-1.5 w-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.9)] pointer-events-none transition-all duration-75"
              style={{
                left: `calc(${Math.max(0, Math.min(100, ((style.position_vertical - 18) / (88 - 18)) * 100))}% - 3px)`,
              }}
            />

            {/* Labels inside track */}
            <div className="relative z-10 w-full flex items-center justify-between text-[11px] text-zinc-400 pointer-events-none">
              <span className="flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
                <MousePointer className="w-3 h-3 text-indigo-400" />
                <span>Move mouse / drag to position</span>
              </span>
              <span className="font-mono text-zinc-200 font-semibold">{style.position_vertical}%</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
            <span>✨</span>
            <span>You can also hover and drag the caption directly on the video player!</span>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Type className="w-3.5 h-3.5 text-zinc-400" /> Font Size
            </span>
            <span className="text-indigo-400 font-semibold">{style.font_size} px</span>
          </div>
          <input
            type="range"
            min={22}
            max={56}
            step={1}
            value={style.font_size}
            onChange={(e) => onChange({ font_size: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
