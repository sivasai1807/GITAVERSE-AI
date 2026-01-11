
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-orange-50">
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-6 shadow-2xl border-4 border-white">
            <img src={DIVINE_LOGO_URL} alt="Krishna Arjuna" className="w-full h-full object-cover" />
          </div>
          <h1 className="cinzel text-4xl font-bold text-stone-800 mb-2 tracking-tighter">GitaVerse AI</h1>
          <p className="text-stone-600 text-sm font-medium">Divine Wisdom Awaits</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang as AppLanguage)}
              className="p-4 bg-white border border-orange-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-orange-500 hover:scale-105 transition-all cinzel text-xs font-bold"
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-[#fffaf5]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-orange-200 shadow-sm">
            <img src={DIVINE_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="cinzel text-lg font-bold leading-none tracking-tight">GitaVerse</h1>
            <p className="text-[9px] text-stone-500 tracking-widest uppercase font-bold">Divine Intelligence</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView(ViewState.LANGUAGE_SELECT)}
          className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-stone-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-orange-100"
        >
          <i className="fa-solid fa-globe"></i>
          {language}
        </button>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {currentView === ViewState.HOME && <Home language={language} uxText={uxText} />}
        {currentView === ViewState.READ && <Read language={language} uxText={uxText} />}
        {currentView === ViewState.ASK_GITA && <AskGita />}
        {currentView === ViewState.DISCOVER && <Discover />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-orange-100 flex justify-around items-center h-20 px-4 z-50 shadow-2xl">
        <NavButton active={currentView === ViewState.HOME} onClick={() => setCurrentView(ViewState.HOME)} icon="fa-house" label="Home" />
        <NavButton active={currentView === ViewState.READ} onClick={() => setCurrentView(ViewState.READ)} icon="fa-book-quran" label="Gita" />
        <NavButton active={currentView === ViewState.ASK_GITA} onClick={() => setCurrentView(ViewState.ASK_GITA)} icon="fa-comment-sparkles" label="Ask Gita" />
        <NavButton active={currentView === ViewState.DISCOVER} onClick={() => setCurrentView(ViewState.DISCOVER)} icon="fa-compass" label="Pathways" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-orange-600 scale-110' : 'text-stone-400 hover:text-stone-600'}`}
  >
    <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-orange-50' : 'bg-transparent'}`}>
      <i className={`fa-solid ${icon} text-lg`}></i>
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
