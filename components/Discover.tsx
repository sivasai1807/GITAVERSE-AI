
import React, { useState, useEffect } from 'react';
import { DiscoverContent } from '../types';
import { geminiService } from '../services/geminiService';

const Discover: React.FC = () => {
  const [content, setContent] = useState<DiscoverContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const data = await geminiService.getDiscoverContent();
        setContent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-stone-500 cinzel">Revealing deeper truths...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 pb-10">
      <header className="py-4">
        <h2 className="cinzel text-2xl font-bold text-stone-800">Spiritual Discovery</h2>
        <p className="text-stone-500 text-sm">Expand your understanding of the Divine song.</p>
      </header>

      {content && (
        <>
          <Section 
            title="Guided Meditations" 
            icon="fa-peace" 
            items={content.meditations} 
            color="bg-indigo-50 text-indigo-700"
          />
          <Section 
            title="Deep Philosophy" 
            icon="fa-brain" 
            items={content.topics} 
            color="bg-teal-50 text-teal-700"
          />
          <Section 
            title="Spiritual Articles" 
            icon="fa-scroll" 
            items={content.articles} 
            color="bg-orange-50 text-orange-700"
          />
          <Section 
            title="Sacred Videos" 
            icon="fa-play" 
            items={content.videos} 
            color="bg-red-50 text-red-700"
          />
        </>
      )}

      <footer className="pt-8 text-center">
        <div className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full text-[10px] text-stone-500 cinzel font-bold">
          <i className="fa-solid fa-lock text-[8px]"></i>
          Future Pathways Await
        </div>
      </footer>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: string; items: string[]; color: string }> = ({ title, icon, items, color }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <h3 className="cinzel text-sm font-bold text-stone-700 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="grid grid-cols-1 gap-3">
      {items.map((item, idx) => (
        <div 
          key={idx}
          className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <span className="text-sm font-medium text-stone-800">{item}</span>
          <i className="fa-solid fa-chevron-right text-stone-300 text-xs"></i>
        </div>
      ))}
    </div>
  </section>
);

export default Discover;
