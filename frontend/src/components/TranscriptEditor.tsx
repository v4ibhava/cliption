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
  original: 'Original (Audio)',
  en: 'English',
  hi: 'Hindi (हिंदी)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
  'zh-CN': 'Chinese (中文)',
  ar: 'Arabic (العربية)',
  pt: 'Portuguese (Português)',
  ru: 'Russian (Русский)',
  it: 'Italian (Italiano)',
  ko: 'Korean (한국어)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  ur: 'Urdu (اردو)',
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
    <div className="bg-[#14161b] border border-zinc-800 rounded-xl p-4 flex flex-col h-full space-y-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            Transcript & Captions
          </h3>
          {detectedLanguage && (
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px] font-medium border border-zinc-700/60 uppercase">
              {detectedLanguage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-[#1a1d24] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
            <Languages className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedLang}
              onChange={(e) => handleTranslate(e.target.value)}
              disabled={isTranslating || segments.length === 0}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code} className="bg-[#1a1d24] text-white">
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onTranscribe}
            disabled={isTranscribing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Transcribing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>{segments.length > 0 ? 'Re-transcribe' : 'Generate Captions'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Segment & Word List */}
      <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-2.5">
        {segments.length === 0 ? (
          <div className="text-center py-14 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <Sparkles className="w-7 h-7 text-indigo-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-zinc-200">No captions generated yet</p>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mt-1">
              Click &quot;Generate Captions&quot; to run offline speech recognition with word-by-word timestamps.
            </p>
          </div>
        ) : (
          segments.map((seg) => {
            const isCurrentSegment = currentTime >= seg.start && currentTime <= seg.end;
            return (
              <div
                key={seg.id}
                className={`p-3 rounded-lg border transition ${
                  isCurrentSegment
                    ? 'border-indigo-500/70 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800/80 bg-[#1a1d24] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-mono text-[11px] text-indigo-400">
                    {formatSec(seg.start)} ➔ {formatSec(seg.end)}
                  </span>
                  <button
                    onClick={() => onSeek(seg.start)}
                    className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 bg-zinc-800/60 hover:bg-zinc-800 rounded transition-colors"
                  >
                    Seek to time
                  </button>
                </div>

                {/* Words Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {seg.words.map((w, wIdx) => {
                    const isWordActive =
                      currentTime >= w.start && currentTime <= w.end;
                    const isEditing = editingWordId === `${seg.id}_${wIdx}`;

                    if (isEditing) {
                      return (
                        <input
                          key={wIdx}
                          type="text"
                          autoFocus
                          value={tempWordVal}
                          onChange={(e) => setTempWordVal(e.target.value)}
                          onBlur={() => saveEditWord(seg.id, wIdx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditWord(seg.id, wIdx);
                            if (e.key === 'Escape') setEditingWordId(null);
                          }}
                          className="bg-black border border-indigo-500 text-white px-2 py-0.5 rounded text-xs focus:outline-none"
                        />
                      );
                    }

                    return (
                      <span
                        key={wIdx}
                        onClick={() => onSeek(w.start)}
                        onDoubleClick={() => startEditWord(seg.id, wIdx, w.word)}
                        title="Click to jump · Double click to edit word"
                        className={`cursor-pointer px-2 py-0.5 rounded text-xs transition-colors select-none ${
                          isWordActive
                            ? 'bg-indigo-600 text-white font-medium shadow-sm'
                            : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
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

      <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
        <span>Click word to jump · Double-click to edit</span>
        {segments.length > 0 && <span>{segments.length} dialogue blocks</span>}
      </div>
    </div>
  );
};

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
}
