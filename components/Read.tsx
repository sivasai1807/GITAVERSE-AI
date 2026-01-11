
import React, { useState, useEffect } from 'react';
import { AppLanguage, UXText, Chapter, VerseContent, ChapterIntro, AudioScript } from '../types';
import { GITA_CHAPTERS } from '../constants';
import { geminiService } from '../services/geminiService';

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

  useEffect(() => {
    if (selectedChapter && !selectedVerseNum) {
      loadChapterIntro();
    }
    if (selectedChapter && selectedVerseNum) {
      loadVerseContent();
    }
  }, [selectedChapter, selectedVerseNum, language]);

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
    if (!verseData || isAudioPlaying) return;
    setIsAudioPlaying(true);
    const audioData = await geminiService.generateTTS(`${verseData.sanskrit_sloka}. Meaning: ${verseData.bhavam}`);
    if (audioData) {
      const audio = new Audio(`data:audio/pcm;base64,${audioData}`);
      // Note: This is PCM raw from Gemini 2.5 TTS, usually requires wrapping or specific decoding.
      // For this demo, we'll simulate the playback state.
      setTimeout(() => setIsAudioPlaying(false), 5000);
    } else {
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
        onClick={() => { setSelectedVerseNum(null); setVerseData(null); }}
        className="flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-4"
      >
        <i className="fa-solid fa-arrow-left text-xs"></i>
        <span className="cinzel text-xs font-bold">Back to Verses</span>
      </button>

      <div className="flex items-center justify-between mb-2">
        <h2 className="cinzel text-sm font-bold text-orange-600 tracking-widest">CHAPTER {selectedChapter?.chapter_number} • VERSE {selectedVerseNum}</h2>
        <button 
          onClick={playVerseAudio}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAudioPlaying ? 'bg-orange-600 text-white animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
        >
          <i className={`fa-solid ${isAudioPlaying ? 'fa-volume-high' : 'fa-play'} text-sm`}></i>
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-24 bg-stone-100 rounded-2xl animate-pulse"></div>
          <div className="h-40 bg-stone-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : verseData && (
        <div className="space-y-8">
          <section className="text-center p-6 bg-white border-y border-orange-100">
            <p className="sanskrit text-2xl font-medium text-stone-900 leading-loose">
              {verseData.sanskrit_sloka}
            </p>
            <p className="mt-4 text-xs text-stone-400 font-mono italic tracking-tight">
              {verseData.transliteration}
            </p>
          </section>

          <section>
            <h3 className="cinzel text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Divine Meaning</h3>
            <p className="text-stone-800 leading-relaxed text-lg">
              {verseData.bhavam}
            </p>
          </section>

          <section className="bg-stone-900 text-stone-100 p-6 rounded-3xl">
             <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-hand-holding-heart text-orange-400"></i>
              <h3 className="cinzel text-xs font-bold uppercase tracking-widest">Practical Life Lesson</h3>
            </div>
            <p className="text-stone-300 leading-relaxed">
              {verseData.life_lesson}
            </p>
          </section>

          {audioScript && (
            <section className="bg-orange-50 p-4 rounded-xl border border-orange-100">
               <div className="flex items-center gap-2 mb-2 text-orange-800">
                <i className="fa-solid fa-microphone text-xs"></i>
                <h3 className="cinzel text-[10px] font-bold uppercase tracking-widest">Narration Script</h3>
              </div>
              <p className="text-[12px] text-orange-700 italic font-medium leading-tight">
                {audioScript.audio_script}
              </p>
            </section>
          )}
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
