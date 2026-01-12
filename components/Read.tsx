
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
    if (selectedChapter && !selectedVerseNum) loadChapterIntro();
    if (selectedChapter && selectedVerseNum) loadVerseContent();
    return () => stopAudio();
  }, [selectedChapter, selectedVerseNum, language]);

  const stopAudio = () => {
    if (sourceNodeRef.current) try { sourceNodeRef.current.stop(); } catch (e) {}
    setIsAudioPlaying(false);
  };

  const loadChapterIntro = async () => {
    if (!selectedChapter) return;
    setLoading(true);
    try {
      const intro = await geminiService.getChapterIntro(selectedChapter.chapter_number, language);
      setChapterIntro(intro);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadVerseContent = async () => {
    if (!selectedChapter || !selectedVerseNum) return;
    setLoading(true);
    setAudioScript(null);
    try {
      const content = await geminiService.getVerseContent(selectedChapter.chapter_number, selectedVerseNum, language);
      const script = await geminiService.getAudioScript(content, language);
      setVerseData(content);
      setAudioScript(script);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleShare = async () => {
    if (!verseData || !selectedChapter || !selectedVerseNum) return;
    if (navigator.share) {
      // Robust URL fix
      let shareUrl = window.location.origin;
      try {
        const urlObj = new URL(window.location.href);
        if (urlObj.protocol.startsWith('http')) {
          shareUrl = window.location.href;
        }
      } catch (e) {
        shareUrl = "https://gitaverse.ai/read";
      }

      try {
        await navigator.share({
          title: `Gita Verse ${selectedChapter.chapter_number}.${selectedVerseNum}`,
          text: `Sanskrit: ${verseData.sanskrit_sloka}\n\nMeaning (${language}): ${verseData.bhavam}\n\n- GitaVerse AI`,
          url: shareUrl,
        });
      } catch (err) { console.error("Share failed", err); }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  const playVerseAudio = async () => {
    if (!verseData || !audioScript) return;
    if (isAudioPlaying) { stopAudio(); return; }
    setIsAudioPlaying(true);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const pcmData = await geminiService.generateTTS(audioScript.audio_script);
      if (pcmData) {
        const audioBuffer = await decodeAudioData(pcmData, ctx);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsAudioPlaying(false);
        source.start(0);
        sourceNodeRef.current = source;
      } else setIsAudioPlaying(false);
    } catch (error) { setIsAudioPlaying(false); }
  };

  const renderChapters = () => (
    <div className="grid grid-cols-1 gap-4 animate-fade-in p-2">
      {GITA_CHAPTERS.map((ch) => (
        <button
          key={ch.chapter_number}
          onClick={() => setSelectedChapter(ch)}
          className="bg-white p-5 rounded-3xl border border-orange-100 flex items-center justify-between group hover:border-orange-500 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <span className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-bold cinzel text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
              {ch.chapter_number}
            </span>
            <div className="text-left">
              <h4 className="cinzel font-bold text-stone-800 text-sm tracking-tight">{ch.chapter_name_sanskrit}</h4>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">{ch.chapter_name_english}</p>
            </div>
          </div>
          <i className="fa-solid fa-arrow-right-long text-stone-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all"></i>
        </button>
      ))}
    </div>
  );

  const renderVerseGrid = () => (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => { setSelectedChapter(null); setChapterIntro(null); }} className="flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-2 font-bold uppercase text-[10px] tracking-widest">
        <i className="fa-solid fa-chevron-left text-xs"></i> All Chapters
      </button>

      <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fa-solid fa-om text-8xl"></i>
        </div>
        <h2 className="cinzel text-2xl font-bold mb-1">{selectedChapter?.chapter_name_sanskrit}</h2>
        <p className="opacity-70 text-[10px] mb-6 uppercase tracking-[0.2em] font-bold">{selectedChapter?.chapter_name_english}</p>
        {loading ? <div className="animate-pulse h-16 bg-white/10 rounded-2xl"></div> : chapterIntro && (
          <p className="text-sm font-medium leading-relaxed opacity-95">{chapterIntro.chapter_summary}</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100">
        <h3 className="cinzel text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">Select Passage</h3>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
          {Array.from({ length: selectedChapter?.total_verses || 0 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVerseNum(v)}
              className="aspect-square bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white hover:scale-110 transition-all shadow-sm"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVerseDetail = () => (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <button onClick={() => { setSelectedVerseNum(null); setVerseData(null); stopAudio(); }} className="flex items-center gap-2 text-stone-500 font-bold uppercase text-[10px] tracking-widest hover:text-orange-600">
          <i className="fa-solid fa-chevron-left text-xs"></i> Verses
        </button>
        <div className="flex items-center gap-3">
           <button 
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-95"
          >
            <i className="fa-solid fa-share-nodes"></i>
          </button>
          <button 
            onClick={playVerseAudio}
            disabled={loading || !audioScript}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${isAudioPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-600 text-white hover:scale-105 active:scale-95 disabled:opacity-50'}`}
          >
            <i className={`fa-solid ${isAudioPlaying ? 'fa-pause' : 'fa-play'} text-xl ml-0.5`}></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="h-40 bg-white border border-orange-100 rounded-3xl animate-pulse"></div>
          <div className="h-60 bg-white border border-orange-100 rounded-3xl animate-pulse"></div>
        </div>
      ) : verseData && (
        <div className="space-y-8">
          <section className="text-center p-10 bg-white border border-orange-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-1 text-[8px] font-black uppercase text-green-600">
               <i className="fa-solid fa-circle-check"></i> Persistent Offline
            </div>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
              Verse {selectedVerseNum}
            </div>
            <p className="sanskrit text-2xl md:text-3xl font-medium text-stone-900 leading-[1.8] mb-6">
              {verseData.sanskrit_sloka}
            </p>
            <p className="text-[10px] text-stone-400 font-mono tracking-widest italic opacity-60">
              {verseData.transliteration}
            </p>
          </section>

          <section className="bg-white p-8 rounded-[2rem] border border-orange-50 shadow-sm">
            <h3 className="cinzel text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <i className="fa-solid fa-feather-pointed"></i> Divine Meaning ({language})
            </h3>
            <p className="text-stone-800 leading-relaxed text-lg italic font-medium">
              {verseData.bhavam}
            </p>
          </section>

          <section className="bg-stone-900 text-stone-100 p-8 rounded-[2rem] shadow-2xl">
            <p className="text-stone-300 leading-relaxed text-sm italic opacity-90">
              {verseData.application_story}
            </p>
          </section>

          <section className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 rounded-[2rem] text-white shadow-xl">
            <p className="text-lg font-bold tracking-tight">
              {verseData.inner_mirror}
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
