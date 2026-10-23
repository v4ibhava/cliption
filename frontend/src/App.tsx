import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Settings,
  Scissors,
  CheckCircle2,
  HardDrive,
  UploadCloud,
  ChevronRight,
  Film,
  Zap,
  Cpu
} from 'lucide-react';
import {
  SystemSpecs,
  UploadedVideo,
  CropConfig,
  CaptionStyle,
  SubtitleSegment,
} from './types';
import { VideoUploader } from './components/VideoUploader';
import { VideoPlayer } from './components/VideoPlayer';
import { AspectSelector } from './components/AspectSelector';
import { CaptionStyler } from './components/CaptionStyler';
import { TranscriptEditor } from './components/TranscriptEditor';
import { ExportModal } from './components/ExportModal';
import { SetupScreen } from './components/SetupScreen';

export const App: React.FC = () => {
  // Step-by-step page-wise navigation: 'setup' -> 'upload' -> 'editor'
  // Starts with 'setup' screen first as requested
  const [currentStep, setCurrentStep] = useState<'setup' | 'upload' | 'editor'>('setup');

  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [selectedTier, setSelectedTier] = useState<'small' | 'medium' | 'large'>('small');
  const [selectedDevice, setSelectedDevice] = useState<'cuda' | 'cpu'>('cpu');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Video State
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Cropping State
  const [crop, setCrop] = useState<CropConfig>({
    aspect_ratio: '9:16',
    fit_mode: 'blur_background',
    pan_x: 0.5,
    pan_y: 0.5,
    zoom: 1.0,
    blur_intensity: 25,
    motion_blur: false,
    motion_blur_intensity: 50,
  });

  // Caption Styling State (defaults to MrBeast style)
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    preset_name: 'mrbeast',
    font_family: 'Impact',
    font_size: 38,
    primary_color: '#FFFFFF',
    highlight_color: '#FFE600',
    outline_color: '#000000',
    outline_width: 4,
    shadow_depth: 2,
    shadow_color: '#000000',
    position_vertical: 80,
    uppercase: true,
    animation_style: 'karaoke',
    max_words_per_line: 4,
  });

  // Transcript & Subtitles State
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Fetch Hardware Specs on mount
  useEffect(() => {
    fetch('/api/system-specs')
      .then((res) => res.json())
      .then((data: SystemSpecs) => {
        setSpecs(data);
        setSelectedTier(data.recommended_tier);
        setSelectedDevice(data.recommended_device);
      })
      .catch((err) => console.error('Failed to detect system specs', err));
  }, []);

  // Transcribe handler
  const handleTranscribe = async () => {
    if (!video) return;
    setIsTranscribing(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: video.video_id,
          tier: selectedTier,
          device: selectedDevice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSegments(data.segments);
        setDetectedLanguage(data.language);
      } else {
        const err = await res.json();
        alert(`Transcription error: ${err.detail || 'Failed to transcribe'}`);
      }
    } catch (e: any) {
      alert(`Transcription request error: ${e.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const tierDisplayNames = {
    small: 'Small (Base)',
    medium: 'Medium (Small)',
    large: 'Large (V3 Turbo)',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-[#f4f4f5]">
      {/* Clean Minimal Header with Stepper */}
      <header className="border-b border-zinc-800/80 bg-[#121418] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Brand & Step Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Scissors className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-semibold text-white tracking-tight">Cliption</span>
              <span className="text-[10px] text-zinc-400 block -mt-0.5">Offline Video Studio</span>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <button
              onClick={() => setCurrentStep('setup')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentStep === 'setup'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'hover:text-zinc-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-zinc-700 text-[10px] flex items-center justify-center text-zinc-300">1</span>
              <span>Setup & Models</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />

            <button
              onClick={() => setCurrentStep('upload')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentStep === 'upload'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'hover:text-zinc-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-zinc-700 text-[10px] flex items-center justify-center text-zinc-300">2</span>
              <span>Upload Video</span>
            </button>

            {video && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                <button
                  onClick={() => setCurrentStep('editor')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentStep === 'editor'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'hover:text-zinc-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-zinc-700 text-[10px] flex items-center justify-center text-zinc-300">3</span>
                  <span>Editor & Export</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Active Model Pill */}
          <button
            onClick={() => setCurrentStep('setup')}
            title="Click to change model or inspect device"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-full text-xs text-zinc-300 transition-colors"
          >
            {specs?.has_nvidia ? (
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            ) : (
              <Cpu className="w-3 h-3 text-indigo-400" />
            )}
            <span className="font-medium text-white">{tierDisplayNames[selectedTier]}</span>
            <span className="text-[10px] text-zinc-500 uppercase">({selectedDevice})</span>
          </button>

          {currentStep === 'editor' && (
            <>
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Change Video
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Video</span>
              </button>
            </>
          )}

          {currentStep !== 'setup' && (
            <button
              onClick={() => setCurrentStep('setup')}
              title="System & Model Setup"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Multi-Step View Container */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        {/* Step 1: Setup & Models Screen (Appears FIRST, zero video upload here) */}
        {currentStep === 'setup' && (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <SetupScreen
              specs={specs}
              selectedTier={selectedTier}
              selectedDevice={selectedDevice}
              onSelectTier={setSelectedTier}
              onSelectDevice={setSelectedDevice}
              onContinue={() => setCurrentStep('upload')}
            />
          </div>
        )}

        {/* Step 2: Upload Video Screen */}
        {currentStep === 'upload' && (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <VideoUploader
              onVideoUploaded={(v) => {
                setVideo(v);
                setCurrentStep('editor');
              }}
              onBackToSetup={() => setCurrentStep('setup')}
            />
          </div>
        )}

        {/* Step 3: Studio Editor Screen */}
        {currentStep === 'editor' && video && (
          <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full max-w-[1750px] w-full mx-auto">
              {/* Left Column: Framing & Caption Style */}
              <div className="lg:col-span-3 space-y-4 overflow-y-auto max-h-[calc(100vh-100px)] pr-1">
                <AspectSelector
                  crop={crop}
                  onChange={(updated) => setCrop((prev) => ({ ...prev, ...updated }))}
                />

                <CaptionStyler
                  style={captionStyle}
                  onChange={(updated) => setCaptionStyle((prev) => ({ ...prev, ...updated }))}
                />
              </div>

              {/* Middle Column: Interactive Video Player */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#13151a] border border-zinc-800 rounded-2xl p-4 shadow-sm">
                <VideoPlayer
                  video={video}
                  crop={crop}
                  style={captionStyle}
                  segments={segments}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  onCaptionPositionChange={(y) => setCaptionStyle((prev) => ({ ...prev, position_vertical: y }))}
                />
              </div>

              {/* Right Column: Transcript & Multilingual Editor */}
              <div className="lg:col-span-4 h-full">
                <TranscriptEditor
                  segments={segments}
                  currentTime={currentTime}
                  detectedLanguage={detectedLanguage}
                  onUpdateSegments={setSegments}
                  onSeek={(time) => setCurrentTime(time)}
                  onTranscribe={handleTranscribe}
                  isTranscribing={isTranscribing}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Export & Render Modal */}
      {video && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          video={video}
          crop={crop}
          style={captionStyle}
          segments={segments}
          useGpu={selectedDevice === 'cuda'}
        />
      )}
    </div>
  );
};

export default App;
