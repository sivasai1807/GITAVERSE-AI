
import React, { useState, useEffect } from 'react';
import { DiscoverContent, VideoItem } from '../types';
import { geminiService } from '../services/geminiService';

const Discover: React.FC = () => {
  const [content, setContent] = useState<DiscoverContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

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
        <p className="text-stone-500 cinzel animate-pulse">Expanding your divine vision...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-12 pb-24 max-w-4xl mx-auto animate-fade-in">
      <header className="text-center py-8">
        <h2 className="cinzel text-3xl font-black text-stone-900 tracking-tighter mb-2">Sacred Exploration</h2>
        <div className="flex justify-center items-center gap-3">
          <div className="h-px w-8 bg-orange-200"></div>
          <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.3em]">Knowledge • Bliss • Eternity</p>
          <div className="h-px w-8 bg-orange-200"></div>
        </div>
      </header>

      {/* Video Portal - Modal Experience */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setActiveVideo(null)}
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
              title={activeVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="mt-8 text-center text-white space-y-2">
            <h3 className="cinzel text-xl font-bold">{activeVideo.title}</h3>
            <p className="text-orange-400 text-xs font-black uppercase tracking-widest">{activeVideo.category}</p>
          </div>
        </div>
      )}

      {content && (
        <div className="space-y-16">
          {/* Featured Video Gallery */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                   <i className="fa-solid fa-play text-sm"></i>
                </div>
                <h3 className="cinzel text-[11px] font-black text-stone-800 uppercase tracking-widest">Sacred Vani Video Series</h3>
              </div>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Garikapati Series & More</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.videos.map((video, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveVideo(video)}
                  className="group relative bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 cursor-pointer active:scale-95"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                       <div className="w-14 h-14 rounded-full bg-white/90 text-orange-600 flex items-center justify-center shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
                          <i className="fa-solid fa-play text-xl ml-1"></i>
                       </div>
                    </div>
                    <div className="absolute top-4 left-4">
                       <span className="bg-stone-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                         {video.category}
                       </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="cinzel text-sm font-bold text-stone-800 group-hover:text-orange-600 transition-colors leading-snug pr-4">
                      {video.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Guided Meditations */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <i className="fa-solid fa-peace text-sm"></i>
              </div>
              <h3 className="cinzel text-[11px] font-black text-stone-800 uppercase tracking-widest">Guided Meditations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.meditations.map((item, idx) => (
                <DiscoverCard key={idx} text={item} color="indigo" />
              ))}
            </div>
          </section>

          {/* Deep Philosophy */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                <i className="fa-solid fa-brain text-sm"></i>
              </div>
              <h3 className="cinzel text-[11px] font-black text-stone-800 uppercase tracking-widest">Divine Philosophy</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.topics.map((item, idx) => (
                <DiscoverCard key={idx} text={item} color="teal" />
              ))}
            </div>
          </section>

          {/* Spiritual Articles */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                <i className="fa-solid fa-scroll text-sm"></i>
              </div>
              <h3 className="cinzel text-[11px] font-black text-stone-800 uppercase tracking-widest">Spiritual Wisdom</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {content.articles.map((item, idx) => (
                <div 
                  key={idx}
                  className="group bg-white p-6 rounded-[2rem] border border-stone-100 flex items-center justify-between hover:border-amber-400 hover:shadow-xl transition-all cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black group-hover:bg-amber-600 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold text-stone-700">{item}</span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"></i>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <footer className="pt-12 text-center">
        <div className="inline-flex items-center gap-3 bg-stone-100/50 backdrop-blur-sm px-6 py-3 rounded-full text-[10px] text-stone-400 cinzel font-black uppercase tracking-widest border border-stone-100">
          <i className="fa-solid fa-dharmachakra animate-spin-slow"></i>
          Deeper Realms Await Your Evolution
        </div>
      </footer>
    </div>
  );
};

const DiscoverCard: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <div className={`group bg-white p-6 rounded-[2rem] border border-stone-100 hover:border-${color}-400 hover:shadow-xl hover:shadow-${color}-100/30 transition-all cursor-pointer flex items-center justify-between active:scale-95 shadow-sm`}>
    <span className="text-sm font-bold text-stone-700">{text}</span>
    <div className={`w-8 h-8 rounded-full border border-stone-50 flex items-center justify-center text-stone-300 group-hover:text-${color}-600 group-hover:bg-${color}-50 group-hover:border-${color}-100 transition-all`}>
      <i className="fa-solid fa-chevron-right text-[10px]"></i>
    </div>
  </div>
);

export default Discover;
