
import React, { useState, useEffect } from 'react';
import { AppLanguage, DailyQuote, DailyStory, UXText } from '../types';
import { geminiService } from '../services/geminiService';

interface HomeProps {
  language: AppLanguage;
  uxText: UXText | null;
}

const Home: React.FC<HomeProps> = ({ language, uxText }) => {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [story, setStory] = useState<DailyStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const q = await geminiService.getDailyQuote(language);
        setQuote(q);
        await new Promise(r => setTimeout(r, 600));
        const s = await geminiService.getDailyStory(language);
        setStory(s);
      } catch (err: any) {
        if (err?.message?.includes('429')) {
          setErrorMsg("Divine wisdom is currently in high demand. Please have patience.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [language]);

  const handleShare = async (title: string, text: string) => {
    if (navigator.share) {
      let shareUrl = window.location.origin;
      try {
        const urlObj = new URL(window.location.href);
        if (urlObj.protocol.startsWith('http')) shareUrl = window.location.href;
      } catch (e) { shareUrl = "https://gitaverse.ai"; }

      try {
        await navigator.share({
          title: `GitaVerse - ${title}`,
          text: `${text}\n\nShared via GitaVerse AI`,
          url: shareUrl,
        });
      } catch (err) { console.error("Share failed", err); }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  if (loading && !quote) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-stone-500 cinzel animate-pulse text-center">Consulting the Sages...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-12 animate-fade-in">
      <section className="text-center py-10">
        <h2 className="cinzel text-3xl font-black text-stone-900 mb-3 tracking-tighter">
          {uxText?.tagline || "Peace be with you."}
        </h2>
        <div className="flex justify-center items-center gap-3">
          <div className="h-px w-8 bg-orange-200"></div>
          <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.3em]">Eternal Bliss</p>
          <div className="h-px w-8 bg-orange-200"></div>
        </div>
      </section>

      {errorMsg && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2rem] flex items-center gap-4 text-orange-800 text-sm shadow-sm">
           <i className="fa-solid fa-hourglass-half animate-spin text-orange-500 text-xl"></i>
           <p className="font-bold italic">{errorMsg}</p>
        </div>
      )}

      {quote && (
        <section className="bg-white border border-orange-50 rounded-[3rem] shadow-2xl shadow-orange-100 overflow-hidden p-10 relative group transition-all duration-500 hover:scale-[1.01]">
          <div className="absolute top-6 right-8 flex gap-2">
             <button 
              onClick={() => handleShare("Daily Inspiration", `${quote.sanskrit_sloka}\n\n${quote.bhavam}`)}
              className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-600 hover:text-white shadow-sm"
            >
              <i className="fa-solid fa-share-nodes text-base"></i>
            </button>
          </div>
          
          <div className="mb-10">
            <div className="w-12 h-1 bg-orange-100 rounded-full mb-4"></div>
            <h3 className="cinzel text-[11px] font-black text-orange-600 uppercase tracking-widest">
              {uxText?.quote_title || "Daily Inspiration"}
            </h3>
          </div>

          <p className="sanskrit text-2xl md:text-3xl font-medium text-stone-900 mb-8 leading-[1.8] italic text-center px-4">
            {quote.sanskrit_sloka}
          </p>
          
          <div className="space-y-6 border-l-2 border-orange-50 pl-8 mb-8">
            <h4 className="text-[9px] uppercase font-black tracking-widest text-stone-400">Slokam Bhavam</h4>
            <p className="text-stone-700 leading-relaxed text-lg font-medium italic">
              {quote.bhavam}
            </p>
          </div>

          <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 shadow-inner">
            <div className="flex items-center gap-3 mb-1">
              <i className="fa-solid fa-lightbulb text-orange-500 text-sm"></i>
              <span className="text-[9px] uppercase font-black tracking-widest text-orange-900 opacity-60">Daily Reflection</span>
            </div>
            <p className="text-orange-900 text-sm font-bold leading-relaxed">
              {quote.daily_reflection}
            </p>
          </div>
        </section>
      )}

      {story && (
        <section className="bg-stone-900 text-stone-100 rounded-[3.5rem] shadow-2xl p-10 space-y-6 relative group transition-all duration-500 hover:shadow-stone-900/40">
          <button 
            onClick={() => handleShare(story.title, `${story.story}\n\nMoral: ${story.moral}`)}
            className="absolute top-6 right-8 w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-600 shadow-sm"
          >
            <i className="fa-solid fa-share-nodes text-base"></i>
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/5 rounded-[1.2rem] flex items-center justify-center">
               <i className="fa-solid fa-feather-pointed text-orange-400 text-xl"></i>
            </div>
            <h3 className="cinzel text-xl font-bold tracking-tight">{story.title}</h3>
          </div>
          
          <p className="text-stone-300 leading-relaxed text-base italic opacity-90">
            {story.story}
          </p>
          
          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-4 bg-orange-400 rounded-full"></div>
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em]">The Moral Path</p>
            </div>
            <p className="text-white font-bold text-lg leading-tight tracking-tight">
              {story.moral}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
