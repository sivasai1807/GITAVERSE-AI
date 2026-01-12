
import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage, ViewState, UXText } from './types';
import { APP_LANGUAGES } from './constants';
import { geminiService } from './services/geminiService';
import Home from './components/Home';
import Read from './components/Read';
import Discover from './components/Discover';
import AskGita from './components/AskGita';

const FALLBACK_LOGO = "https://images.unsplash.com/photo-1590059392655-08e826b1f237?q=80&w=400&auto=format&fit=crop";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANGUAGE_SELECT);
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [uxText, setUxText] = useState<UXText | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const fetchingUxRef = useRef(false);

  useEffect(() => {
    if (currentView !== ViewState.LANGUAGE_SELECT && !fetchingUxRef.current) {
      loadUXText();
    }
  }, [currentView, language]);

  const loadUXText = async () => {
    if (fetchingUxRef.current) return;
    fetchingUxRef.current = true;
    setLoading(true);
    try {
      const text = await geminiService.getUXText(language);
      setUxText(text);
    } catch (err) {
      console.error("Error loading UX text", err);
    } finally {
      setLoading(false);
      fetchingUxRef.current = false;
    }
  };

  const selectLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    setCurrentView(ViewState.HOME);
  };

  if (currentView === ViewState.LANGUAGE_SELECT) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-50/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]"></div>
        
        <div className="text-center mb-16 flex flex-col items-center relative z-10">
          <div className="w-56 h-56 rounded-full overflow-hidden mb-8 divine-aura border-[10px] border-white bg-white flex items-center justify-center shadow-2xl relative">
            <img 
              src={FALLBACK_LOGO} 
              alt="Krishna Logo" 
              className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" 
            />
          </div>
          <h1 className="cinzel text-4xl md:text-5xl font-black text-stone-900 mb-3 tracking-tighter">GitaVerse AI</h1>
          <div className="flex items-center gap-4">
             <div className="h-px w-10 bg-orange-200"></div>
             <p className="text-orange-600 text-[9px] font-black uppercase tracking-[0.4em]">Eternal Wisdom • Modern Light</p>
             <div className="h-px w-10 bg-orange-200"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full relative z-10">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang as AppLanguage)}
              className="group p-5 bg-white border border-stone-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-orange-400 hover:-translate-y-1 transition-all flex flex-col items-center gap-2 active:scale-95"
            >
              <span className="cinzel text-[10px] font-black text-stone-800 group-hover:text-orange-600 transition-colors uppercase tracking-widest">{lang}</span>
              <div className="w-4 h-1 bg-stone-100 group-hover:w-10 group-hover:bg-orange-500 transition-all rounded-full"></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fffcf9] overflow-hidden">
      <header className="flex-none z-50 bg-white/80 backdrop-blur-2xl border-b border-orange-50/50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView(ViewState.HOME)}>
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-orange-100 shadow-sm bg-white flex items-center justify-center transition-transform group-hover:scale-105">
            <img 
              src={FALLBACK_LOGO} 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <h1 className="cinzel text-lg font-black leading-none tracking-tight text-stone-900">GitaVerse</h1>
            <p className="text-[8px] text-orange-600 tracking-[0.2em] uppercase font-black mt-1">Divine Path</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView(ViewState.LANGUAGE_SELECT)}
          className="px-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 active:scale-95 transition-all"
        >
          <i className="fa-solid fa-earth-asia text-orange-400"></i>
          {language}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth">
        <div className="max-w-4xl mx-auto w-full pb-32 pt-4">
          {currentView === ViewState.HOME && <Home language={language} uxText={uxText} />}
          {currentView === ViewState.READ && <Read language={language} uxText={uxText} />}
          {currentView === ViewState.ASK_GITA && <AskGita />}
          {currentView === ViewState.DISCOVER && <Discover />}
        </div>
      </main>

      <nav className="flex-none bg-white/95 backdrop-blur-3xl border-t border-orange-50 flex justify-around items-center h-20 px-6 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[2.5rem]">
        <NavButton active={currentView === ViewState.HOME} onClick={() => setCurrentView(ViewState.HOME)} icon="fa-house" label="Home" />
        <NavButton active={currentView === ViewState.READ} onClick={() => setCurrentView(ViewState.READ)} icon="fa-book-open" label="Read" />
        <NavButton active={currentView === ViewState.ASK_GITA} onClick={() => setCurrentView(ViewState.ASK_GITA)} icon="fa-wand-magic-sparkles" label="Ask Gita" />
        <NavButton active={currentView === ViewState.DISCOVER} onClick={() => setCurrentView(ViewState.DISCOVER)} icon="fa-compass" label="Explore" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all group relative ${active ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
  >
    <div className={`w-11 h-11 rounded-2xl transition-all duration-300 flex items-center justify-center ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-transparent text-stone-500'}`}>
      <i className={`fa-solid ${icon} text-base`}></i>
    </div>
    <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${active ? 'text-orange-600' : 'text-stone-400'}`}>{label}</span>
  </button>
);

export default App;
