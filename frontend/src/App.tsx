import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Scissors, Terminal, Wrench } from 'lucide-react';
import {
  SystemSpecs,
  UploadedVideo,
  CropConfig,
  CaptionStyle,
  SubtitleSegment,
} from './types';
import { HardwareBanner } from './components/HardwareBanner';
import { ModelTierModal } from './components/ModelTierModal';
import { VideoUploader } from './components/VideoUploader';
import { VideoPlayer } from './components/VideoPlayer';
import { AspectSelector } from './components/AspectSelector';
import { CaptionStyler } from './components/CaptionStyler';
import { TranscriptEditor } from './components/TranscriptEditor';
import { ExportModal } from './components/ExportModal';
import { SetupScreen } from './components/SetupScreen';

export const App: React.FC = () => {
  // First screen setup toggle: defaults to true if not previously completed
  const [isSetupView, setIsSetupView] = useState(() => {
    return !localStorage.getItem('cliption_setup_done');
  });

  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [selectedTier, setSelectedTier] = useState<'small' | 'medium' | 'large'>('small');
  const [selectedDevice, setSelectedDevice] = useState<'cuda' | 'cpu'>('cpu');
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
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

  const handleCompleteSetup = () => {
    localStorage.setItem('cliption_setup_done', 'true');
    setIsSetupView(false);
  };

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

  // If setup screen is active, show it as first screen
  if (isSetupView) {
    return (
      <SetupScreen
        specs={specs}
        selectedTier={selectedTier}
        selectedDevice={selectedDevice}
        onSelectTier={setSelectedTier}
        onSelectDevice={setSelectedDevice}
        onCompleteSetup={handleCompleteSetup}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0C0D0E] text-[#F3F4F6] font-mono selection:bg-[#FFE600] selection:text-black">
      {/* Top Hardware Banner */}
      <HardwareBanner
        specs={specs}
        selectedTier={selectedTier}
        selectedDevice={selectedDevice}
        onOpenTierModal={() => setIsTierModalOpen(true)}
        onOpenSetup={() => setIsSetupView(true)}
      />

      {/* Main Navigation Header */}
      <header className="px-5 py-3 border-b-2 border-black bg-[#141517] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FFE600] text-black border-2 border-black flex items-center justify-center shadow-brutal-sm font-black">
            <Scissors className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider text-white uppercase">
                CLIPTION <span className="text-[#FFE600]">// STUDIO</span>
              </h1>
              <span className="bg-[#00FF66] text-black border border-black text-[9px] font-black px-1.5 py-0.2 uppercase shadow-brutal-sm">
                100% OFFLINE
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-tight">
              SMART CROP & MULTILINGUAL DYNAMIC CAPTIONS (CPU + NVIDIA CUDA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSetupView(true)}
            className="btn-brutal bg-[#26282B] text-white hover:text-[#FFE600] px-3 py-1.5 text-xs flex items-center gap-1.5"
            title="Return to Dependency & Model Setup Screen"
          >
            <Wrench className="w-3.5 h-3.5 text-[#FFE600]" />
            <span>SETUP WIZARD</span>
          </button>

          {video && (
            <>
              <button
                onClick={() => setVideo(null)}
                className="btn-brutal bg-[#26282B] text-white hover:text-[#FFE600] px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>NEW CLIP</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="btn-brutal bg-[#FFE600] hover:bg-[#FFF066] text-black px-4 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 stroke-[3]" />
                <span>EXPORT {crop.aspect_ratio}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {!video ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto">
            <div className="text-center mb-6 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#26282B] text-[#FFE600] border-2 border-black text-xs font-black uppercase mb-4 shadow-brutal-sm">
                <Terminal className="w-3.5 h-3.5" />
                NEO-BRUTALIST CREATOR TOOLKIT
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase mb-3">
                CROP & CAPTION <br />
                <span className="text-[#FFE600] underline decoration-4 underline-offset-4">VIRAL SHORTS</span> OFFLINE
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed uppercase">
                Reframe horizontal video to 9:16 reels, transcribe speech offline on CPU or NVIDIA GPU, and style high-energy captions like MrBeast & Hormozi.
              </p>
            </div>

            <VideoUploader onVideoUploaded={(v) => setVideo(v)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full max-w-[1750px] w-full mx-auto">
            {/* Left Column: Aspect Ratio & Caption Styler */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
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
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#141517] border-2 border-black p-4 shadow-brutal">
              <VideoPlayer
                video={video}
                crop={crop}
                style={captionStyle}
                segments={segments}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
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
        )}
      </main>

      {/* Hardware & Model Tier Modal */}
      <ModelTierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        specs={specs}
        selectedTier={selectedTier}
        selectedDevice={selectedDevice}
        onSelectTier={setSelectedTier}
        onSelectDevice={setSelectedDevice}
      />

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
