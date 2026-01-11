
import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage, UXText, Chapter, VerseContent, ChapterIntro, AudioScript } from '../types';
import { GITA_CHAPTERS } from '../constants';
import { geminiService, decodeAudioData } from '../services/geminiService';

interface ReadProps {
  language: AppLanguage;
  uxText: UXText | null;
}

const Read: React.FC<ReadProps> = ({ language, uxText }) => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);
  const [verseData, setVerseData] = useState<VerseContent | null>(null);
  const [chapterIntro, setChapterIntro] = useState<ChapterIntro | null>(null);
  const [audioScript, setAudioScript] = useState<AudioScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (selectedChapter && !selectedVerseNum) {
      loadChapterIntro();
    }
    if (selectedChapter && selectedVerseNum) {
      loadVerseContent();
    }
    
    return () => {
      stopAudio();
    };
  }, [selectedChapter, selectedVerseNum, language]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
    }
    setIsAudioPlaying(false);
  };

  const loadChapterIntro = async () => {
    if (!selectedChapter) return;
    setLoading(true);
    try {
      const intro = await geminiService.getChapterIntro(selectedChapter.chapter_number, language);
      setChapterIntro(intro);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVerseContent = async () => {
    if (!selectedChapter || !selectedVerseNum) return;
    setLoading(true);
    setAudioScript(null);
    try {
      const content = await geminiService.getVerseContent(selectedChapter.chapter_number, selectedVerseNum, language);
      const script = await geminiService.getAudioScript(selectedChapter.chapter_number, selectedVerseNum, language);
      setVerseData(content);
      setAudioScript(script);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playVerseAudio = async () => {
    if (!verseData || !audioScript) return;
    
    if (isAudioPlaying) {
      stopAudio();
      return;
    }

    setIsAudioPlaying(true);
    
    try {
      // Initialize AudioContext on first user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const pcmData = await geminiService.generateTTS(audioScript.audio_script);
      if (pcmData) {
        const audioBuffer = await decodeAudioData(pcmData, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsAudioPlaying(false);
        source.start(0);
        sourceNodeRef.current = source;
      } else {
        setIsAudioPlaying(false);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsAudioPlaying(false);
    }
  };

  const renderChapters = () => (
    <div className="grid grid-cols-1 gap-3">
      {GITA_CHAPTERS.map((ch) => (
        <button
          key={ch.chapter_number}
          onClick={() => setSelectedChapter(ch)}
          className="bg-white p-4 rounded-2xl border border-orange-100 flex items-center justify-between group hover:border-orange-400 transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold cinzel border border-orange-100">
              {ch.chapter_number}
            </span>
            <div className="text-left">
              <h4 className="cinzel font-bold text-stone-800 text-sm">{ch.chapter_name_sanskrit}</h4>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest">{ch.chapter_name_english}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="text-[10px] text-stone-400 font-bold">{ch.total_verses} Verses</span>
            <i className="fa-solid fa-chevron-right text-stone-300 group-hover:text-orange-600 transition-colors"></i>
          </div>
        </button>
      ))}
    </div>
  );

  const renderVerseGrid = () => (
    <div className="space-y-6">
      <button 
        onClick={() => { setSelectedChapter(null); setChapterIntro(null); }}
        className="flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-4"
      >
        <i className="fa-solid fa-arrow-left text-xs"></i>
        <span className="cinzel text-xs font-bold">All Chapters</span>
      </button>

      <div className="bg-orange-600 text-white p-6 rounded-3xl shadow-lg">
        <h2 className="cinzel text-xl font-bold mb-1">{selectedChapter?.chapter_name_sanskrit}</h2>
        <p className="opacity-80 text-xs mb-4 uppercase tracking-widest">{selectedChapter?.chapter_name_english}</p>
        
        {loading ? (
          <div className="animate-pulse h-12 bg-orange-500 rounded-xl"></div>
        ) : chapterIntro && (
          <div className="text-sm space-y-3">
            <p className="font-medium opacity-90">{chapterIntro.chapter_summary}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">Theme: {chapterIntro.core_theme}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="cinzel text-sm font-bold text-stone-500 mb-4 uppercase tracking-widest">Select Verse</h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {Array.from({ length: selectedChapter?.total_verses || 0 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVerseNum(v)}
              className="aspect-square bg-white rounded-lg border border-orange-100 flex items-center justify-center text-sm font-bold hover:bg-orange-600 hover:text-white transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVerseDetail = () => (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <button 
        onClick={() => { setSelectedVerseNum(null); setVerseData(null); stopAudio(); }}
        className="flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-4"
      >
        <i className="fa-solid fa-arrow-left text-xs"></i>
        <span className="cinzel text-xs font-bold">Back to Verses</span>
      </button>

      <div className="flex items-center justify-between mb-2">
        <h2 className="cinzel text-sm font-bold text-orange-600 tracking-widest uppercase">
          CH {selectedChapter?.chapter_number} • Verse {selectedVerseNum}
        </h2>
        <button 
          onClick={playVerseAudio}
          disabled={loading || !audioScript}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isAudioPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-600 text-white hover:scale-105 active:scale-95 disabled:opacity-50'}`}
        >
          <i className={`fa-solid ${isAudioPlaying ? 'fa-stop' : 'fa-play'} text-lg ml-0.5`}></i>
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-24 bg-stone-100 rounded-2xl animate-pulse"></div>
          <div className="h-40 bg-stone-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : verseData && (
        <div className="space-y-8 animate-fade-in">
          <section className="text-center p-8 bg-white border border-orange-100 rounded-3xl shadow-sm">
            <p className="sanskrit text-2xl md:text-3xl font-medium text-stone-900 leading-relaxed mb-6">
              {verseData.sanskrit_sloka}
            </p>
            <div className="w-12 h-0.5 bg-orange-200 mx-auto mb-6"></div>
            <p className="text-xs text-stone-400 font-mono italic tracking-wide">
              {verseData.transliteration}
            </p>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-orange-50 shadow-sm">
            <h3 className="cinzel text-xs font-bold text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fa-solid fa-book-open-reader"></i>
              Bhavam (Meaning)
            </h3>
            <p className="text-stone-800 leading-relaxed text-lg italic">
              {verseData.bhavam}
            </p>
          </section>

          <section className="bg-stone-900 text-stone-100 p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fa-solid fa-scroll text-6xl"></i>
            </div>
             <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-lightbulb text-orange-400"></i>
              <h3 className="cinzel text-sm font-bold uppercase tracking-widest">Real-Life Application</h3>
            </div>
            <p className="text-stone-300 leading-relaxed text-base">
              {verseData.application_story}
            </p>
          </section>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 min-h-screen">
      {!selectedChapter && renderChapters()}
      {selectedChapter && !selectedVerseNum && renderVerseGrid()}
      {selectedChapter && selectedVerseNum && renderVerseDetail()}
    </div>
  );
};

export default Read;
