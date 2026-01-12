
import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage, UXText, Chapter, VerseContent, ChapterIntro, AudioScript } from '../types';
import { GITA_CHAPTERS } from '../constants';
import { geminiService, decodeAudioData, getPersisted, toggleBookmark, isBookmarked, getAllBookmarks } from '../services/geminiService';

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
  
  // Offline/Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cachedVerses, setCachedVerses] = useState<Set<number>>(new Set());
  const [isChapterOffline, setIsChapterOffline] = useState(false);

  // Bookmark states
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isVerseBookmarked, setIsVerseBookmarked] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, [language]);

  useEffect(() => {
    if (selectedChapter) {
      updateOfflineStatus();
      if (!selectedVerseNum) loadChapterIntro();
      if (selectedVerseNum) {
        loadVerseContent();
        checkBookmarkStatus();
      }
    }
    return () => stopAudio();
  }, [selectedChapter, selectedVerseNum, language]);

  const loadBookmarks = async () => {
    const all = await getAllBookmarks(language);
    setBookmarks(all);
  };

  const checkBookmarkStatus = async () => {
    if (selectedChapter && selectedVerseNum) {
      const bookmarked = await isBookmarked(selectedChapter.chapter_number, selectedVerseNum, language);
      setIsVerseBookmarked(bookmarked);
    }
  };

  const handleToggleBookmark = async () => {
    if (selectedChapter && selectedVerseNum) {
      const result = await toggleBookmark(selectedChapter.chapter_number, selectedVerseNum, language);
      setIsVerseBookmarked(result);
      loadBookmarks();
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) try { sourceNodeRef.current.stop(); } catch (e) {}
    setIsAudioPlaying(false);
  };

  const updateOfflineStatus = async () => {
    if (!selectedChapter) return;
    const cached = new Set<number>();
    let offlineCount = 0;
    for (let i = 1; i <= selectedChapter.total_verses; i++) {
      const data = await getPersisted(`verse-${selectedChapter.chapter_number}-${i}-${language}`);
      if (data) {
        cached.add(i);
        offlineCount++;
      }
    }
    setCachedVerses(cached);
    setIsChapterOffline(offlineCount === selectedChapter.total_verses);
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

  const downloadChapter = async () => {
    if (!selectedChapter || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      for (let i = 1; i <= selectedChapter.total_verses; i++) {
        await geminiService.getVerseContent(selectedChapter.chapter_number, i, language);
        setDownloadProgress(Math.round((i / selectedChapter.total_verses) * 100));
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 50));
      }
      await updateOfflineStatus();
    } catch (err) {
      console.error("Download failed", err);
      alert("Divine connection interrupted. Some verses were saved successfully.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const downloadIndividualVerse = async (vNum: number) => {
    if (!selectedChapter) return;
    try {
      await geminiService.getVerseContent(selectedChapter.chapter_number, vNum, language);
      await updateOfflineStatus();
    } catch (err) {
      console.error("Individual download failed", err);
    }
  };

  const clearChapterOffline = async () => {
    if (!selectedChapter || !window.confirm("Do you want to clear these verses from local storage? You will need internet to read them again.")) return;
    
    const dbName = 'GitaVerseDB_v5';
    const request = indexedDB.open(dbName);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction('content', 'readwrite');
      const store = transaction.objectStore('content');
      for (let i = 1; i <= selectedChapter.total_verses; i++) {
        store.delete(`verse-${selectedChapter.chapter_number}-${i}-${language}`);
      }
      transaction.oncomplete = () => {
        updateOfflineStatus();
      };
    };
  };

  const handleShare = async () => {
    if (!verseData || !selectedChapter || !selectedVerseNum) return;
    if (navigator.share) {
      let shareUrl = window.location.origin;
      try {
        const urlObj = new URL(window.location.href);
        if (urlObj.protocol.startsWith('http')) shareUrl = window.location.href;
      } catch (e) { shareUrl = "https://gitaverse.ai/read"; }

      try {
        await navigator.share({
          title: `Gita Verse ${selectedChapter.chapter_number}.${selectedVerseNum}`,
          text: `Sloka: ${verseData.sanskrit_sloka}\n\nMeaning (${language}): ${verseData.bhavam}\n\nRef: Ch ${selectedChapter.chapter_number} Verse ${selectedVerseNum}`,
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

  const openBookmarkedVerse = (chapterNum: number, verseNum: number) => {
    const chapter = GITA_CHAPTERS.find(c => c.chapter_number === chapterNum);
    if (chapter) {
      setSelectedChapter(chapter);
      setSelectedVerseNum(verseNum);
    }
  };

  const renderChapters = () => (
    <div className="flex flex-col gap-8 animate-fade-in p-4 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="cinzel text-2xl font-black text-stone-900 mb-2">Bhagavad Gita</h2>
        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">The Celestial Song of the Lord</p>
      </div>

      {bookmarks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center text-xs shadow-lg">
              <i className="fa-solid fa-bookmark"></i>
            </div>
            <h3 className="cinzel text-[11px] font-black text-stone-800 uppercase tracking-widest">Bookmarked Scrolls</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-2">
            {bookmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => openBookmarkedVerse(b.chapter, b.verse)}
                className="flex-none w-32 bg-white p-4 rounded-3xl border border-orange-100 shadow-sm hover:border-orange-500 transition-all active:scale-95 text-center"
              >
                <div className="text-[10px] font-black text-orange-600 mb-1">CH {b.chapter}</div>
                <div className="cinzel text-xl font-bold text-stone-900 mb-1">V {b.verse}</div>
                <div className="h-0.5 w-6 bg-orange-100 mx-auto rounded-full"></div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4">
        {GITA_CHAPTERS.map((ch) => (
          <button
            key={ch.chapter_number}
            onClick={() => setSelectedChapter(ch)}
            className="bg-white p-6 rounded-[2.5rem] border border-orange-50 flex items-center justify-between group hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-6">
              <span className="w-14 h-14 bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-2xl flex items-center justify-center font-bold cinzel text-xl shadow-lg group-hover:rotate-[360deg] transition-transform duration-700">
                {ch.chapter_number}
              </span>
              <div>
                <h4 className="cinzel font-bold text-stone-800 text-base leading-tight group-hover:text-orange-600 transition-colors">{ch.chapter_name_sanskrit}</h4>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-black mt-1 opacity-70 group-hover:opacity-100 transition-all">{ch.chapter_name_english}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-all duration-300">
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderVerseGrid = () => (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => { setSelectedChapter(null); setChapterIntro(null); }} className="flex items-center gap-2 text-stone-400 hover:text-orange-600 font-black uppercase text-[10px] tracking-widest transition-colors">
          <i className="fa-solid fa-chevron-left text-xs"></i> All Chapters
        </button>
        
        <div className="flex gap-2">
          {isChapterOffline && (
            <button 
              onClick={clearChapterOffline}
              className="px-4 py-2 bg-stone-100 text-stone-500 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-stone-200"
            >
              <i className="fa-solid fa-trash-can mr-1"></i> Clear Cache
            </button>
          )}
          {!isChapterOffline ? (
            <button 
              disabled={isDownloading}
              onClick={downloadChapter}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all border border-orange-100 shadow-sm"
            >
              {isDownloading ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> {downloadProgress}%</>
              ) : (
                <><i className="fa-solid fa-cloud-arrow-down"></i> Save Chapter</>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-green-600 text-[9px] font-black uppercase tracking-widest bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm">
              <i className="fa-solid fa-circle-check"></i> Chapter Offline
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-orange-50 p-10 rounded-[3rem] shadow-2xl shadow-orange-50 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-20"></div>
        <div className="w-16 h-16 bg-orange-50 rounded-full mx-auto flex items-center justify-center mb-6">
          <i className="fa-solid fa-om text-orange-600 text-3xl opacity-40"></i>
        </div>
        <h2 className="cinzel text-3xl font-black text-stone-900 mb-2 leading-tight">
          {selectedChapter?.chapter_name_sanskrit}
        </h2>
        <p className="text-[10px] mb-8 uppercase tracking-[0.3em] font-black text-stone-400 opacity-60">Chapter {selectedChapter?.chapter_number}</p>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-stone-50 rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-stone-50 rounded-full w-3/4 mx-auto animate-pulse"></div>
          </div>
        ) : chapterIntro && (
          <p className="text-stone-600 font-medium leading-[1.8] text-sm italic">{chapterIntro.chapter_summary}</p>
        )}
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-orange-50 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-stone-100"></div>
          <h3 className="cinzel text-[10px] font-black text-stone-400 uppercase tracking-widest">Select Verse</h3>
          <div className="h-px flex-1 bg-stone-100"></div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
          {Array.from({ length: selectedChapter?.total_verses || 0 }, (_, i) => i + 1).map((v) => {
            const isCached = cachedVerses.has(v);
            return (
              <button
                key={v}
                onClick={() => setSelectedVerseNum(v)}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center text-xs font-black transition-all shadow-sm active:scale-90 relative ${
                  isCached 
                    ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-600 hover:text-white' 
                    : 'bg-stone-50 border-stone-50 text-stone-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:scale-110'
                }`}
              >
                {v}
                {isCached && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderVerseDetail = () => (
    <div className="space-y-8 animate-fade-in p-4 pb-32 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => { setSelectedVerseNum(null); setVerseData(null); stopAudio(); }} className="flex items-center gap-2 text-stone-400 font-black uppercase text-[10px] tracking-widest hover:text-orange-600 transition-colors">
          <i className="fa-solid fa-chevron-left text-xs"></i> Verses
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleBookmark}
            className={`w-12 h-12 rounded-[1.5rem] border flex items-center justify-center transition-all active:scale-95 shadow-sm ${isVerseBookmarked ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-stone-100 text-stone-500 hover:bg-orange-50 hover:text-orange-600'}`}
            title={isVerseBookmarked ? "Remove Bookmark" : "Bookmark Verse"}
          >
            <i className={`fa-solid fa-bookmark`}></i>
          </button>
          <button 
            onClick={handleShare}
            className="w-12 h-12 rounded-[1.5rem] bg-white border border-stone-100 text-stone-500 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-95 shadow-sm"
          >
            <i className="fa-solid fa-share-nodes"></i>
          </button>
          <button 
            onClick={playVerseAudio}
            disabled={loading || !audioScript}
            className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${isAudioPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-900 text-white hover:bg-orange-600 hover:scale-105 active:scale-95 disabled:opacity-50'}`}
          >
            <i className={`fa-solid ${isAudioPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-48 bg-white border border-stone-50 rounded-[3rem]"></div>
          <div className="h-64 bg-white border border-stone-50 rounded-[3rem]"></div>
        </div>
      ) : verseData && (
        <div className="space-y-8">
          <section className="text-center p-12 bg-white border border-orange-50 rounded-[4rem] shadow-2xl shadow-orange-50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl z-10">
              Verse {selectedChapter?.chapter_number}.{selectedVerseNum}
            </div>
            
            <div className="mt-8 space-y-8">
              <p className="sanskrit text-2xl md:text-4xl font-medium text-stone-900 leading-[2] drop-shadow-sm px-2">
                {verseData.sanskrit_sloka}
              </p>
              <div className="flex flex-col gap-1 items-center opacity-40 group-hover:opacity-80 transition-opacity">
                <div className="h-px w-20 bg-stone-200"></div>
                <p className="text-[9px] text-stone-400 font-black tracking-[0.3em] uppercase italic">
                  {verseData.transliteration}
                </p>
                <div className="h-px w-20 bg-stone-200"></div>
              </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[3rem] border border-orange-50 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                <i className="fa-solid fa-scroll text-sm"></i>
              </div>
              <h3 className="cinzel text-[11px] font-black text-stone-800 uppercase tracking-widest">Slokam Bhavam</h3>
            </div>
            <p className="text-stone-800 leading-relaxed text-lg italic font-medium">
              {verseData.bhavam}
            </p>
          </section>

          <section className="bg-stone-900 text-stone-100 p-10 rounded-[3.5rem] shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <i className="fa-solid fa-dharmachakra text-[120px] rotate-[15deg]"></i>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400">
                <i className="fa-solid fa-leaf text-sm"></i>
              </div>
              <h3 className="cinzel text-[10px] font-black uppercase tracking-widest text-orange-400">Arjuna's Reflection</h3>
            </div>
            <p className="text-stone-300 leading-relaxed text-base italic opacity-90 relative z-10">
              {verseData.application_story}
            </p>
          </section>

          <section className="bg-gradient-to-br from-orange-500 to-amber-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative group overflow-hidden">
             <div className="absolute -bottom-4 -right-4 p-4 opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              <i className="fa-solid fa-eye text-[100px]"></i>
            </div>
            <div className="flex items-center gap-3 mb-4">
               <h3 className="cinzel text-[10px] font-black uppercase tracking-[0.3em] opacity-80">The Inner Mirror</h3>
            </div>
            <p className="text-xl font-bold tracking-tight leading-snug drop-shadow-md">
              {verseData.inner_mirror}
            </p>
          </section>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {!selectedChapter && renderChapters()}
      {selectedChapter && !selectedVerseNum && renderVerseGrid()}
      {selectedChapter && selectedVerseNum && renderVerseDetail()}
    </div>
  );
};

export default Read;
