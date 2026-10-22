import React, { useState, useEffect } from 'react';
import { Sparkles, Type, Palette, MoveVertical, Check, Eye } from 'lucide-react';
import { CaptionStyle } from '../types';

interface CaptionStylerProps {
  style: CaptionStyle;
  onChange: (updated: Partial<CaptionStyle>) => void;
}

export const CaptionStyler: React.FC<CaptionStylerProps> = ({ style, onChange }) => {
  const [activeWordDemoIdx, setActiveWordDemoIdx] = useState(1);
  const sampleWords = ['CREATE', 'VIRAL', 'SHORTS'];

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
      name: 'MRBEAST',
      tag: 'VIRAL YELLOW',
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
      name: 'HORMOZI',
      tag: 'NEON LIME',
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
      name: 'MINIMAL',
      tag: 'CLEAN WHITE',
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
      name: 'CYBERPUNK',
      tag: 'CYAN/MAGENTA',
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
    <div className="bg-[#18191B] border-2 border-black p-4 space-y-4 shadow-brutal font-mono">
      {/* Presets Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#FFE600] inline-block" />
            <label className="text-[11px] font-black uppercase text-zinc-300 tracking-wider">
              // CAPTION STYLE PRESETS
            </label>
          </div>
          <span className="text-[9px] text-[#FFE600] font-black uppercase">
            [CLICK TO PREVIEW]
          </span>
        </div>

        {/* 4 Preset Cards with Real Visual Word Rendering */}
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => {
            const isSelected = style.preset_name === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`p-2.5 border-2 border-black text-left transition select-none flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#26282B] border-[#FFE600] shadow-brutal-yellow'
                    : 'bg-[#1F2023] hover:bg-[#26282B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs text-white uppercase">{p.name}</span>
                  {isSelected && (
                    <div className="w-4 h-4 bg-[#FFE600] text-black flex items-center justify-center border border-black shadow-brutal-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Rendered Visual Mini-Preview */}
                <div className="bg-black/90 p-2 border border-zinc-800 text-center my-1 select-none overflow-hidden">
                  <div
                    style={{ fontFamily: p.font }}
                    className="text-xs font-black tracking-wide leading-tight"
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

                <div className="text-[9px] uppercase text-zinc-400 font-bold mt-1">
                  TAG: <span className="text-zinc-200">{p.tag}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Active Style Demo Banner */}
      <div className="bg-black border-2 border-black p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-black">
          <span className="flex items-center gap-1.5 text-[#FFE600]">
            <Eye className="w-3.5 h-3.5" /> LIVE STYLE PREVIEW
          </span>
          <span className="text-zinc-500">[{style.font_family} // {style.font_size}PX]</span>
        </div>

        {/* Animated Text Box */}
        <div className="py-2.5 px-3 bg-[#141517] border border-zinc-800 text-center rounded overflow-hidden">
          <div
            style={{ fontFamily: style.font_family }}
            className="font-black tracking-wide flex items-center justify-center gap-2 select-none"
          >
            {sampleWords.map((word, i) => {
              const isActive = i === activeWordDemoIdx;
              const displayText = style.uppercase ? word.toUpperCase() : word.toLowerCase();

              return (
                <span
                  key={i}
                  className={`inline-block transition-transform duration-100 ${
                    isActive ? 'scale-110 font-black' : 'scale-100 opacity-90'
                  }`}
                  style={{
                    fontSize: `${Math.max(18, Math.min(28, style.font_size * 0.7))}px`,
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
          <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase">FONT FAMILY</label>
          <select
            value={style.font_family}
            onChange={(e) => onChange({ font_family: e.target.value, preset_name: 'custom' })}
            className="w-full bg-black border-2 border-black px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFE600] font-bold"
          >
            <option value="Impact">IMPACT (CLASSIC BOLD)</option>
            <option value="Montserrat">MONTSERRAT (VIRAL HEAVY)</option>
            <option value="Anton">ANTON (TALL BOLD)</option>
            <option value="Bebas Neue">BEBAS NEUE (CONDENSED)</option>
            <option value="Arial">ARIAL BLACK</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase">ANIMATION</label>
          <select
            value={style.animation_style}
            onChange={(e) => onChange({ animation_style: e.target.value as any })}
            className="w-full bg-black border-2 border-black px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFE600] font-bold"
          >
            <option value="karaoke">KARAOKE HIGHLIGHT</option>
            <option value="word_by_word">WORD POP-IN</option>
            <option value="none">STATIC SEGMENT</option>
          </select>
        </div>
      </div>

      {/* Colors & Toggles */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase">HIGHLIGHT</label>
          <div className="flex items-center gap-1.5 bg-black border-2 border-black px-1.5 py-1">
            <input
              type="color"
              value={style.highlight_color}
              onChange={(e) => onChange({ highlight_color: e.target.value, preset_name: 'custom' })}
              className="w-5 h-5 cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[10px] font-bold text-white uppercase truncate">
              {style.highlight_color}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase">TEXT COLOR</label>
          <div className="flex items-center gap-1.5 bg-black border-2 border-black px-1.5 py-1">
            <input
              type="color"
              value={style.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value, preset_name: 'custom' })}
              className="w-5 h-5 cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[10px] font-bold text-white uppercase truncate">
              {style.primary_color}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={() => onChange({ uppercase: !style.uppercase })}
            className={`w-full py-1.5 px-1 border-2 border-black text-[10px] font-black transition select-none ${
              style.uppercase
                ? 'bg-[#FFE600] text-black shadow-brutal-sm'
                : 'bg-black text-zinc-400'
            }`}
          >
            {style.uppercase ? '[ALL CAPS]' : '[LOWERCASE]'}
          </button>
        </div>
      </div>

      {/* Vertical Position & Font Size */}
      <div className="space-y-3 pt-1 border-t border-zinc-800">
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
            <span className="flex items-center gap-1">
              <MoveVertical className="w-3.5 h-3.5 text-[#FFE600]" /> VERTICAL POSITION
            </span>
            <span className="text-[#FFE600]">{style.position_vertical}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={88}
            step={1}
            value={style.position_vertical}
            onChange={(e) => onChange({ position_vertical: parseInt(e.target.value) })}
            className="w-full h-2 bg-black border border-black appearance-none cursor-pointer accent-[#FFE600]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
            <span className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-[#00FF66]" /> FONT SIZE
            </span>
            <span className="text-[#00FF66]">{style.font_size} PX</span>
          </div>
          <input
            type="range"
            min={22}
            max={56}
            step={1}
            value={style.font_size}
            onChange={(e) => onChange({ font_size: parseInt(e.target.value) })}
            className="w-full h-2 bg-black border border-black appearance-none cursor-pointer accent-[#00FF66]"
          />
        </div>
      </div>
    </div>
  );
};
