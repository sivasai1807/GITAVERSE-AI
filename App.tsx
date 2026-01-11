
import React, { useState, useEffect } from 'react';
import { AppLanguage, ViewState, UXText } from './types';
import { APP_LANGUAGES } from './constants';
import { geminiService } from './services/geminiService';
import Home from './components/Home';
import Read from './components/Read';
import Discover from './components/Discover';
import AskGita from './components/AskGita';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANGUAGE_SELECT);
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [uxText, setUxText] = useState<UXText | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Reliable public URL for the Krishna-Arjuna painting
  const DIVINE_LOGO_URL = "https://m.media-amazon.com/images/I/91M-1Pq-D6L._AC_UF1000,1000_QL80_.jpg";

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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-orange-50 relative overflow-hidden">
        {/* Subtle background patterns */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

        <div className="text-center mb-16 flex flex-col items-center relative z-10 animate-fade-in">
          <div className="w-44 h-44 rounded-full overflow-hidden mb-8 shadow-2xl border-4 border-white ring-8 ring-orange-100">
            <img 
              src={DIVINE_LOGO_URL} 
              alt="Krishna Arjuna" 
              className="w-full h-full object-cover scale-110" 
            />
          </div>
          <h1 className="cinzel text-5xl font-black text-stone-900 mb-3 tracking-tighter">GitaVerse AI</h1>
          <div className="flex items-center gap-3">
             <div className="h-px w-10 bg-orange-300"></div>
             <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.4em]">Vedic Wisdom Reborn</p>
             <div className="h-px w-10 bg-orange-300"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full relative z-10">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang as AppLanguage)}
              className="group p-6 bg-white border border-orange-100 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-orange-500 hover:-translate-y-2 transition-all flex flex-col items-center gap-3"
            >
              <span className="cinzel text-xs font-black text-stone-800 group-hover:text-orange-600 transition-colors uppercase tracking-widest">{lang}</span>
              <div className="w-8 h-1 bg-orange-50 group-hover:w-12 group-hover:bg-orange-500 transition-all rounded-full"></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-[#fffcf9]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-orange-50 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView(ViewState.HOME)}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-orange-100 shadow-md transform hover:rotate-3 transition-transform">
            <img 
              src={DIVINE_LOGO_URL} 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <h1 className="cinzel text-xl font-black leading-none tracking-tight text-stone-900">GitaVerse</h1>
            <p className="text-[10px] text-orange-600 tracking-[0.2em] uppercase font-black mt-1">Divine AI Guide</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView(ViewState.LANGUAGE_SELECT)}
          className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl text-stone-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-50 transition-all active:scale-95"
        >
          <i className="fa-solid fa-language text-base"></i>
          {language}
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 overflow-x-hidden pt-6">
        {currentView === ViewState.HOME && <Home language={language} uxText={uxText} />}
        {currentView === ViewState.READ && <Read language={language} uxText={uxText} />}
        {currentView === ViewState.ASK_GITA && <AskGita />}
        {currentView === ViewState.DISCOVER && <Discover />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-orange-50 flex justify-around items-center h-24 px-8 z-50 shadow-[0_-15px_50px_-15px_rgba(0,0,0,0.1)] rounded-t-[3rem]">
        <NavButton active={currentView === ViewState.HOME} onClick={() => setCurrentView(ViewState.HOME)} icon="fa-house-user" label="Sanctuary" />
        <NavButton active={currentView === ViewState.READ} onClick={() => setCurrentView(ViewState.READ)} icon="fa-book-quran" label="Scripture" />
        <NavButton active={currentView === ViewState.ASK_GITA} onClick={() => setCurrentView(ViewState.ASK_GITA)} icon="fa-comment-sparkles" label="Dialogue" />
        <NavButton active={currentView === ViewState.DISCOVER} onClick={() => setCurrentView(ViewState.DISCOVER)} icon="fa-compass-sparkles" label="Paths" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 transition-all group ${active ? 'scale-110' : 'hover:scale-105 opacity-40 hover:opacity-100'}`}
  >
    <div className={`w-14 h-14 rounded-3xl transition-all duration-300 flex items-center justify-center ${active ? 'bg-orange-600 text-white shadow-2xl shadow-orange-600/30 -translate-y-4' : 'bg-transparent text-stone-400 group-hover:text-orange-500'}`}>
      <i className={`fa-solid ${icon} text-xl`}></i>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors ${active ? 'text-orange-600' : 'text-stone-400'}`}>{label}</span>
    {active && <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></div>}
  </button>
);

export default App;
