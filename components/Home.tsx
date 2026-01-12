
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
      // Fix for "Invalid URL" error: ensure the URL is absolute and valid
      let shareUrl = window.location.origin;
      try {
        const urlObj = new URL(window.location.href);
        if (urlObj.protocol.startsWith('http')) {
          shareUrl = window.location.href;
        }
      } catch (e) {
        shareUrl = "https://gitaverse.ai"; // Fallback placeholder
      }

      try {
        await navigator.share({
          title: `GitaVerse - ${title}`,
          text: `${text}\n\nShared via GitaVerse AI`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
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
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-8 animate-fade-in">
      <section className="text-center py-6 bg-gradient-to-b from-orange-50 to-transparent rounded-3xl">
        <h2 className="cinzel text-2xl font-bold text-stone-800 mb-2">
          {uxText?.tagline || "Peace be with you."}
        </h2>
        <div className="w-16 h-1 bg-orange-200 mx-auto rounded-full"></div>
      </section>

      {errorMsg && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-3 text-orange-800 text-sm">
           <i className="fa-solid fa-hourglass-half animate-spin text-orange-500"></i>
           <p className="font-medium italic">{errorMsg}</p>
        </div>
      )}

      {quote && (
        <section className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden p-6 relative group">
          <div className="absolute top-4 right-4 flex gap-2">
             <button 
              onClick={() => handleShare("Daily Inspiration", `${quote.sanskrit_sloka}\n\n${quote.bhavam}`)}
              className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-600 hover:text-white"
            >
              <i className="fa-solid fa-share-nodes text-sm"></i>
            </button>
            <i className="fa-solid fa-quote-right text-orange-100 text-6xl opacity-30"></i>
          </div>
          <h3 className="cinzel text-xs font-bold text-orange-600 uppercase tracking-widest mb-4">
            {uxText?.quote_title || "Daily Inspiration"}
          </h3>
          <p className="sanskrit text-lg font-medium text-stone-900 mb-4 leading-relaxed italic">
            {quote.sanskrit_sloka}
          </p>
          <p className="text-stone-700 leading-relaxed mb-4 border-l-2 border-orange-100 pl-4">
            {quote.bhavam}
          </p>
          <div className="bg-orange-50 p-3 rounded-xl flex items-center justify-between">
            <p className="text-orange-900 text-sm font-bold flex items-center gap-2">
              <i className="fa-solid fa-lightbulb text-orange-500"></i>
              {quote.daily_reflection}
            </p>
            <div className="text-[8px] text-green-600 font-black uppercase tracking-widest bg-white px-2 py-1 rounded-md">Offline</div>
          </div>
        </section>
      )}

      {story && (
        <section className="bg-stone-900 text-stone-100 rounded-3xl shadow-xl p-8 space-y-4 relative group">
          <button 
            onClick={() => handleShare(story.title, `${story.story}\n\nMoral: ${story.moral}`)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-600"
          >
            <i className="fa-solid fa-share-nodes text-sm"></i>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-stone-800 rounded-lg">
               <i className="fa-solid fa-feather-pointed text-orange-400"></i>
            </span>
            <h3 className="cinzel text-lg font-bold">{story.title}</h3>
          </div>
          <p className="text-stone-300 leading-relaxed text-sm">
            {story.story}
          </p>
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
            <p className="text-orange-300 italic text-sm">
              <span className="font-bold uppercase tracking-tighter not-italic mr-2">Moral:</span>
              {story.moral}
            </p>
            <span className="text-[8px] opacity-30 uppercase tracking-widest font-black">Saved Permanently</span>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
