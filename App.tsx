
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-orange-50 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        
        <div className="text-center mb-12 relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden shadow-2xl mx-auto mb-8 bg-white p-1">
             <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Krishna_Arjuna.jpg/800px-Krishna_Arjuna.jpg" 
              alt="Gita Logo" 
              className="w-full h-full object-cover rounded-full"
             />
          </div>
          <h1 className="cinzel text-5xl font-black text-stone-900 mb-2 tracking-tighter">GitaVerse</h1>
          <div className="flex items-center justify-center gap-3">
             <div className="h-px w-8 bg-orange-300"></div>
             <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.3em]">Divine AI Companion</p>
             <div className="h-px w-8 bg-orange-300"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full relative z-10">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang as AppLanguage)}
              className="group p-5 bg-white border border-orange-100 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:border-orange-500 hover:-translate-y-1 transition-all flex flex-col items-center gap-2"
            >
              <span className="cinzel text-[11px] font-black text-stone-800 group-hover:text-orange-600 transition-colors uppercase tracking-widest">{lang}</span>
              <div className="w-6 h-0.5 bg-orange-100 group-hover:w-10 group-hover:bg-orange-500 transition-all"></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-[#fffaf5] transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-orange-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
             <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Krishna_Arjuna.jpg/800px-Krishna_Arjuna.jpg" 
              alt="Logo" 
              className="w-full h-full object-cover"
             />
          </div>
          <div>
            <h1 className="cinzel text-lg font-black leading-none tracking-tight text-stone-900">GitaVerse</h1>
            <p className="text-[9px] text-orange-600 tracking-[0.2em] uppercase font-black mt-0.5">Sanatana Dharma</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView(ViewState.LANGUAGE_SELECT)}
          className="px-4 py-2 bg-stone-50 border border-orange-100 rounded-2xl text-stone-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm active:scale-95"
        >
          <i className="fa-solid fa-language text-sm"></i>
          {language}
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 overflow-x-hidden pt-4">
        {currentView === ViewState.HOME && <Home language={language} uxText={uxText} />}
        {currentView === ViewState.READ && <Read language={language} uxText={uxText} />}
        {currentView === ViewState.ASK_GITA && <AskGita />}
        {currentView === ViewState.DISCOVER && <Discover />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-orange-100 flex justify-around items-center h-24 px-6 z-50 shadow-[0_-10px_40px_-15px_rgba(249,115,22,0.15)] rounded-t-[2.5rem]">
        <NavButton active={currentView === ViewState.HOME} onClick={() => setCurrentView(ViewState.HOME)} icon="fa-house-chimney-window" label="Divine Home" />
        <NavButton active={currentView === ViewState.READ} onClick={() => setCurrentView(ViewState.READ)} icon="fa-om" label="Holy Gita" />
        <NavButton active={currentView === ViewState.ASK_GITA} onClick={() => setCurrentView(ViewState.ASK_GITA)} icon="fa-comment-dots" label="Ask Krishna" />
        <NavButton active={currentView === ViewState.DISCOVER} onClick={() => setCurrentView(ViewState.DISCOVER)} icon="fa-dharmachakra" label="Infinite Path" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 transition-all group ${active ? 'scale-110' : 'hover:scale-105 opacity-50 hover:opacity-100'}`}
  >
    <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 -translate-y-2' : 'bg-transparent text-stone-400 group-hover:text-orange-400'}`}>
      <i className={`fa-solid ${icon} text-xl`}></i>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${active ? 'text-orange-600' : 'text-stone-400'}`}>{label}</span>
    {active && <div className="w-1 h-1 rounded-full bg-orange-600 animate-pulse"></div>}
  </button>
);

export default App;
