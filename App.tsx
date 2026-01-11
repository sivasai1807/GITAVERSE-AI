
import React, { useState, useEffect } from 'react';
import { AppLanguage, ViewState, UXText } from './types';
import { APP_LANGUAGES } from './constants';
import { geminiService } from './services/geminiService';
import Home from './components/Home';
import Read from './components/Read';
import Discover from './components/Discover';
import AskGita from './components/AskGita';

// Path for the user's logo - assumed to be in the project root as logo.png
const DIVINE_LOGO_PATH = "logo.png"; 
const FALLBACK_LOGO = "https://images.unsplash.com/photo-1590059392655-08e826b1f237?q=80&w=400&auto=format&fit=crop";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANGUAGE_SELECT);
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [uxText, setUxText] = useState<UXText | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentView !== ViewState.LANGUAGE_SELECT && !uxText) {
      loadUXText();
    }
  }, [currentView, language]);

  const loadUXText = async () => {
    setLoading(true);
    try {
      const text = await geminiService.getUXText(language);
      setUxText(text);
    } catch (err) {
      console.error("Error loading UX text", err);
    } finally {
      setLoading(false);
    }
  };

  const selectLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    setCurrentView(ViewState.HOME);
  };

  if (currentView === ViewState.LANGUAGE_SELECT) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden no-scrollbar">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-50/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]"></div>
        
        <div className="text-center mb-16 flex flex-col items-center relative z-10">
          <div className="w-60 h-60 rounded-full overflow-hidden mb-10 divine-aura border-[10px] border-white bg-white flex items-center justify-center shadow-2xl relative">
            <img 
              src={DIVINE_LOGO_PATH} 
              alt="Krishna Logo" 
              className="w-full h-full object-cover scale-150 object-center transition-transform hover:scale-[1.65] duration-700" 
              onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
            />
          </div>
          <h1 className="cinzel text-5xl font-black text-stone-900 mb-4 tracking-tighter">GitaVerse AI</h1>
          <div className="flex items-center gap-4">
             <div className="h-px w-12 bg-orange-200"></div>
             <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.5em]">Ancient Wisdom • Modern Voice</p>
             <div className="h-px w-12 bg-orange-200"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full relative z-10">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang as AppLanguage)}
              className="group p-6 bg-white/80 backdrop-blur-sm border border-stone-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-orange-400 hover:-translate-y-2 transition-all flex flex-col items-center gap-3 active:scale-95"
            >
              <span className="cinzel text-[11px] font-black text-stone-800 group-hover:text-orange-600 transition-colors uppercase tracking-widest">{lang}</span>
              <div className="w-6 h-1 bg-stone-100 group-hover:w-14 group-hover:bg-orange-500 transition-all rounded-full"></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-[#fffcf9] no-scrollbar overflow-hidden">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-orange-50/50 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView(ViewState.HOME)}>
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-100 shadow-sm bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
            <img 
              src={DIVINE_LOGO_PATH} 
              alt="Logo" 
              className="w-full h-full object-cover scale-150" 
              onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
            />
          </div>
          <div>
            <h1 className="cinzel text-xl font-black leading-none tracking-tight text-stone-900">GitaVerse</h1>
            <p className="text-[9px] text-orange-600 tracking-[0.3em] uppercase font-black mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
              Divine Guidance
            </p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView(ViewState.LANGUAGE_SELECT)}
          className="px-5 py-2.5 bg-stone-900 border border-stone-800 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
        >
          <i className="fa-solid fa-earth-asia text-sm text-orange-400"></i>
          {language}
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 overflow-y-auto no-scrollbar pt-4">
        {currentView === ViewState.HOME && <Home language={language} uxText={uxText} />}
        {currentView === ViewState.READ && <Read language={language} uxText={uxText} />}
        {currentView === ViewState.ASK_GITA && <AskGita />}
        {currentView === ViewState.DISCOVER && <Discover />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-orange-50 flex justify-around items-center h-24 px-8 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[3.5rem]">
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
    className={`flex flex-col items-center gap-2 transition-all group relative ${active ? 'scale-110' : 'hover:scale-105 opacity-40 hover:opacity-100'}`}
  >
    <div className={`w-14 h-14 rounded-[1.8rem] transition-all duration-300 flex items-center justify-center ${active ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30 -translate-y-4' : 'bg-transparent text-stone-500'}`}>
      <i className={`fa-solid ${icon} text-lg`}></i>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${active ? 'text-orange-600 translate-y-[-10px]' : 'text-stone-400'}`}>{label}</span>
  </button>
);

export default App;
