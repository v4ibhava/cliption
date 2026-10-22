import React, { useState } from 'react';
import { Languages, Wand2, Check, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { SubtitleSegment } from '../types';

interface TranscriptEditorProps {
  segments: SubtitleSegment[];
  currentTime: number;
  detectedLanguage: string;
  onUpdateSegments: (newSegments: SubtitleSegment[]) => void;
  onSeek: (time: number) => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
}

const SUPPORTED_LANGUAGES: { [key: string]: string } = {
  original: 'ORIGINAL (AUDIO)',
  en: 'ENGLISH',
  hi: 'HINDI (हिंदी)',
  es: 'SPANISH (ESPAÑOL)',
  fr: 'FRENCH (FRANÇAIS)',
  de: 'GERMAN (DEUTSCH)',
  ja: 'JAPANESE (日本語)',
  'zh-CN': 'CHINESE (中文)',
  ar: 'ARABIC (العربية)',
  pt: 'PORTUGUESE (PORTUGUÊS)',
  ru: 'RUSSIAN (РУССКИЙ)',
  it: 'ITALIAN (ITALIANO)',
  ko: 'KOREAN (한국어)',
  bn: 'BENGALI (বাংলা)',
  mr: 'MARATHI (मराठी)',
  ta: 'TAMIL (தமிழ்)',
  te: 'TELUGU (తెలుగు)',
  ur: 'URDU (اردو)',
};

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  segments,
  currentTime,
  detectedLanguage,
  onUpdateSegments,
  onSeek,
  onTranscribe,
  isTranscribing,
}) => {
  const [selectedLang, setSelectedLang] = useState('original');
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [tempWordVal, setTempWordVal] = useState('');

  const handleTranslate = async (targetLang: string) => {
    setSelectedLang(targetLang);
    if (targetLang === 'original' || segments.length === 0) return;

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments,
          target_language: targetLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateSegments(data.segments);
      }
    } catch (e) {
      console.error('Translation failed', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const startEditWord = (segId: number, wordIdx: number, currentText: string) => {
    setEditingWordId(`${segId}_${wordIdx}`);
    setTempWordVal(currentText);
  };

  const saveEditWord = (segId: number, wordIdx: number) => {
    const newSegments = segments.map((seg) => {
      if (seg.id === segId) {
        const newWords = [...seg.words];
        newWords[wordIdx] = {
          ...newWords[wordIdx],
          word: tempWordVal.trim(),
        };
        const newText = newWords.map((w) => w.word).join(' ');
        return {
          ...seg,
          text: newText,
          words: newWords,
        };
      }
      return seg;
    });

    onUpdateSegments(newSegments);
    setEditingWordId(null);
  };

  return (
    <div className="bg-[#18191B] border-2 border-black p-4 flex flex-col h-full space-y-3 shadow-brutal font-mono">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#FFE600] inline-block" />
          <h3 className="text-xs font-black uppercase text-white tracking-wider">
            // TRANSCRIPT & AI TRANSLATION
          </h3>
          {detectedLanguage && (
            <span className="bg-black text-[#00FF66] border border-black px-1.5 py-0.2 text-[9px] font-black uppercase">
              LANG: {detectedLanguage.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-black border-2 border-black px-2 py-1 text-xs">
            <Languages className="w-3.5 h-3.5 text-[#FFE600]" />
            <select
              value={selectedLang}
              onChange={(e) => handleTranslate(e.target.value)}
              disabled={isTranslating || segments.length === 0}
              className="bg-transparent text-white font-bold text-[10px] focus:outline-none cursor-pointer"
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code} className="bg-black text-white">
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onTranscribe}
            disabled={isTranscribing}
            className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black px-3 py-1 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[3]" />
                <span>AI WORKING...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{segments.length > 0 ? 'RE-TRANSCRIBE' : 'GENERATE AI CAPTIONS'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Segment & Word List */}
      <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-2.5">
        {segments.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-700 bg-black/40">
            <Sparkles className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
            <p className="text-xs font-black uppercase text-white">NO CAPTIONS LOADED</p>
            <p className="text-[10px] text-zinc-400 max-w-xs mx-auto mt-1">
              CLICK &quot;GENERATE AI CAPTIONS&quot; TO RUN OFFLINE SPEECH-TO-TEXT WITH WORD-BY-WORD TIMESTAMPS.
            </p>
          </div>
        ) : (
          segments.map((seg) => {
            const isCurrentSegment = currentTime >= seg.start && currentTime <= seg.end;
            return (
              <div
                key={seg.id}
                className={`p-2.5 border-2 border-black transition ${
                  isCurrentSegment
                    ? 'bg-[#26282B] border-2 border-[#FFE600] shadow-brutal-yellow'
                    : 'bg-[#1F2023] hover:bg-[#26282B]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5 font-bold">
                  <span className="text-[#00FF66]">
                    [{formatSec(seg.start)} ➔ {formatSec(seg.end)}]
                  </span>
                  <button
                    onClick={() => onSeek(seg.start)}
                    className="text-[#FFE600] hover:underline uppercase text-[9px] font-black"
                  >
                    SEEK HERE ▶
                  </button>
                </div>

                {/* Words Chips styled like stickers */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {seg.words.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    const wordKey = `${seg.id}_${wIdx}`;
                    const isEditing = editingWordId === wordKey;

                    if (isEditing) {
                      return (
                        <div key={wIdx} className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={tempWordVal}
                            onChange={(e) => setTempWordVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditWord(seg.id, wIdx)}
                            className="px-2 py-0.5 bg-black border-2 border-[#FFE600] text-xs text-white focus:outline-none font-bold"
                          />
                          <button
                            onClick={() => saveEditWord(seg.id, wIdx)}
                            className="p-1 bg-[#00FF66] text-black border-2 border-black"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <span
                        key={wIdx}
                        onClick={() => onSeek(w.start)}
                        onDoubleClick={() => startEditWord(seg.id, wIdx, w.word)}
                        title="Click to jump video, double-click to edit text"
                        className={`px-1.5 py-0.5 text-xs font-black uppercase cursor-pointer select-none border-2 border-black transition ${
                          isWordActive
                            ? 'bg-[#FFE600] text-black shadow-brutal-sm scale-105'
                            : 'bg-black text-white hover:bg-zinc-800'
                        }`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-zinc-400 border-t-2 border-black pt-2 flex items-center justify-between font-bold">
        <span>[TIP: DOUBLE-CLICK ANY WORD TO EDIT]</span>
        <span>TOTAL: {segments.length} BLOCKS</span>
      </div>
    </div>
  );
};

function formatSec(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
