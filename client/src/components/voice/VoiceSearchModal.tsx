import React, { useState, useEffect, useRef } from 'react';
import { apiExtractVoicePreferences } from '../../services/api';
import { ExtractedJobPreferences } from '../../types';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle,
  X,
  Volume2,
  Edit3,
  Search,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPreferences: (prefs: ExtractedJobPreferences) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onConfirmPreferences
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedJobPreferences | null>(null);
  const [extractorName, setExtractorName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields when extracted
  const [editSkill, setEditSkill] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWage, setEditWage] = useState(800);
  const [editDistance, setEditDistance] = useState(5);
  const [editAvailability, setEditAvailability] = useState('Immediate');

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  if (!isOpen) return null;

  const startListening = () => {
    setErrorMsg(null);
    setExtractedData(null);
    transcriptRef.current = '';
    setTranscript('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMsg('Web Speech API is not supported in this browser. Please use manual voice text input below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const completeTranscript = Array.from(event.results as ArrayLike<any>)
          .map((result: any) => result?.[0]?.transcript || '')
          .join(' ')
          .replace(/\\s+/g, ' ')
          .trim();
        transcriptRef.current = completeTranscript;
        setTranscript(completeTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please allow microphone permission or type below.');
        } else {
          setErrorMsg(`Voice input: ${event.error}. You can also type or use sample prompts below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const spokenText = transcriptRef.current.trim();
        if (spokenText) void handleProcessTranscript(spokenText);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      setErrorMsg(e.message || 'Error starting speech recognition.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleProcessTranscript = async (textToProcess?: string) => {
    const queryText = (textToProcess || transcript).trim();
    if (!queryText) {
      setErrorMsg('Please speak into the mic or type your trade requirements first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await apiExtractVoicePreferences(queryText, language);
      if (res.success && res.preferences) {
        setExtractedData(res.preferences);
        setExtractorName(res.meta?.extractor || 'Kaamsetu Hybrid NLP');
        setEditSkill(res.preferences.skill);
        setEditLocation(res.preferences.location);
        setEditWage(res.preferences.expected_wage);
        setEditDistance(res.preferences.preferred_distance);
        setEditAvailability(res.preferences.availability);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing job requirements.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSamplePrompt = (sampleText: string, sampleLang: 'hi-IN' | 'en-IN') => {
    setLanguage(sampleLang);
    transcriptRef.current = sampleText;
    setTranscript(sampleText);
    void handleProcessTranscript(sampleText);
  };

  const handleConfirmAndSearch = () => {
    if (!editSkill) return;
    onConfirmPreferences({
      skill: editSkill,
      location: editLocation,
      expected_wage: Number(editWage),
      preferred_distance: Number(editDistance),
      availability: editAvailability,
      wage_type: 'daily'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-brand-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary-light flex items-center justify-center text-brand-primary">
              <Sparkles className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-brand-dark">Voice-to-Work AI</h3>
              <p className="text-xs text-brand-muted">Speak naturally in Hindi or English to discover nearby work</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-brand-dark rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Toggle */}
        <div className="mt-4 flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <span className="text-xs font-semibold text-brand-muted px-2">Spoken Language:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setLanguage('hi-IN')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                language === 'hi-IN' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:bg-slate-200'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => setLanguage('en-IN')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                language === 'en-IN' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:bg-slate-200'
              }`}
            >
              English (India)
            </button>
          </div>
        </div>

        {/* Microphone Action Area */}
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-brand-accent/20 animate-ping scale-150" />
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                isListening
                  ? 'bg-brand-accent ring-8 ring-brand-accent/30'
                  : 'bg-brand-primary hover:bg-brand-primary-dark ring-8 ring-brand-primary/10'
              }`}
            >
              {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <span className="mt-3 text-xs font-bold uppercase tracking-wider text-brand-dark">
            {isListening ? 'Listening... Speak Now' : 'Click Mic to Speak'}
          </span>
          <span className="text-[11px] text-brand-muted">
            {isListening ? 'Speak naturally about your trade, location, and rate' : 'Or type / pick sample prompt below'}
          </span>
        </div>

        {/* Live / Editable Transcript Textarea */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-brand-dark block mb-1">
            Your Voice Transcript or Query:
          </label>
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                language === 'hi-IN'
                  ? 'उदा: "मुझे कल से इलेक्ट्रीशियन का काम चाहिए, सेक्टर 62 में 800 रुपये रोज"'
                  : 'e.g. "I am a plumber looking for work tomorrow within five kilometres, wage 700 rupees daily"'
              }
              rows={3}
              className="w-full text-xs p-3.5 rounded-2xl border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark leading-relaxed"
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-brand-muted">
              {transcript.length > 0 ? `${transcript.length} characters` : 'Tip: Mention trade, sector & wage'}
            </span>
            <button
              onClick={() => handleProcessTranscript()}
              disabled={isProcessing || !transcript.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark disabled:opacity-50 transition-all shadow-sm"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Extract Job Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Prompts (For Hackathon Judges) */}
        {!extractedData && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block mb-2">
              Try Seeded Hackathon Prompts:
            </span>
            <div className="space-y-2">
              <button
                onClick={() =>
                  handleSamplePrompt(
                    'Mujhe kal se electrician ka kaam chahiye. Main Sector 62 mein rehta hoon aur mujhe 800 rupaye daily chahiye.',
                    'hi-IN'
                  )
                }
                className="w-full text-left p-2.5 rounded-xl bg-brand-primary-light/60 hover:bg-brand-primary-light border border-brand-primary/10 text-xs text-brand-dark transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-semibold text-brand-primary">🇮🇳 Hindi Demo:</span> "Mujhe kal se electrician ka kaam chahiye... Sector 62... ₹800"
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() =>
                  handleSamplePrompt(
                    'I am a plumber looking for work tomorrow within five kilometres. My expected wage is 700 rupees per day.',
                    'en-IN'
                  )
                }
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-brand-dark transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-semibold text-brand-secondary">🇬🇧 English Demo:</span> "I am a plumber looking for work tomorrow... 5 km... ₹700"
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Extracted Structured Output - Editable Before Searching */}
        {extractedData && (
          <div className="mt-6 p-4 rounded-2xl bg-brand-primary-light/40 border border-brand-primary/20 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-brand-primary/10 mb-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-brand-dark">Structured Job Preferences</span>
              </div>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded text-brand-secondary border border-brand-secondary/20">
                {extractorName}
              </span>
            </div>

            <p className="text-[11px] text-brand-muted mb-3">
              Review and adjust the extracted preferences before querying the matching engine:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase">Detected Trade</label>
                <input
                  type="text"
                  value={editSkill}
                  onChange={(e) => setEditSkill(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase">Location / Sector</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase">Daily Wage (₹)</label>
                <input
                  type="number"
                  value={editWage}
                  onChange={(e) => setEditWage(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase">Max Distance (km)</label>
                <input
                  type="number"
                  value={editDistance}
                  onChange={(e) => setEditDistance(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Availability</label>
                <input
                  type="text"
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmAndSearch}
              className="mt-4 w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-primary/20"
            >
              <Search className="w-4 h-4 text-brand-accent" />
              <span>Search Hyperlocal Jobs with These Preferences</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
