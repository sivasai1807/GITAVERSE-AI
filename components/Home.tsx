
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [q, s] = await Promise.all([
          geminiService.getDailyQuote(language),
          geminiService.getDailyStory(language)
        ]);
        setQuote(q);
        setStory(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [language]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-stone-500 cinzel animate-pulse">Consulting the Sages...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-8 animate-fade-in">
      {/* Welcome Banner */}
      <section className="text-center py-6 bg-gradient-to-b from-orange-50 to-transparent rounded-3xl">
        <h2 className="cinzel text-2xl font-bold text-stone-800 mb-2">
          {uxText?.tagline || "Peace be with you."}
        </h2>
        <div className="w-16 h-1 bg-orange-200 mx-auto rounded-full"></div>
      </section>

      {/* Daily Quote Card */}
      {quote && (
        <section className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden p-6 relative">
          <div className="absolute top-0 right-0 p-4">
            <i className="fa-solid fa-quote-right text-orange-100 text-6xl"></i>
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
          <div className="bg-orange-50 p-3 rounded-xl">
            <p className="text-orange-900 text-sm font-bold flex items-center gap-2">
              <i className="fa-solid fa-lightbulb text-orange-500"></i>
              {quote.daily_reflection}
            </p>
          </div>
        </section>
      )}

      {/* Daily Story Card */}
      {story && (
        <section className="bg-stone-900 text-stone-100 rounded-3xl shadow-xl p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-stone-800 rounded-lg">
               <i className="fa-solid fa-feather-pointed text-orange-400"></i>
            </span>
            <h3 className="cinzel text-lg font-bold">{story.title}</h3>
          </div>
          <p className="text-stone-300 leading-relaxed text-sm">
            {story.story}
          </p>
          <div className="pt-4 border-t border-stone-800">
            <p className="text-orange-300 italic text-sm">
              <span className="font-bold uppercase tracking-tighter not-italic mr-2">Moral:</span>
              {story.moral}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
