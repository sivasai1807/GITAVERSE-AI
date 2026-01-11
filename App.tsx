
import React, { useState, useEffect } from 'react';
import { AppLanguage, ViewState, UXText } from './types';
import { APP_LANGUAGES } from './constants';
import { geminiService } from './services/geminiService';
import Home from './components/Home';
import Read from './components/Read';
import Discover from './components/Discover';

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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-orange-50">
        <div className="text-center mb-12">
          <i className="fa-solid fa-om text-6xl text-orange-600 mb-4"></i>
          <h1 className="cinzel text-4xl font-bold text-stone-800 mb-2">GitaVerse AI</h1>
          <p className="text-stone-600">Select your divine language of study</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang as AppLanguage)}
              className="p-4 bg-white border border-orange-200 rounded-xl shadow-sm hover:shadow-md hover:bg-orange-600 hover:text-white transition-all cinzel text-sm"
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-om text-orange-600 text-2xl"></i>
          <div>
            <h1 className="cinzel text-lg font-bold leading-none">GitaVerse</h1>
            <p className="text-[10px] text-stone-500 tracking-widest uppercase">Divine Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView(ViewState.LANGUAGE_SELECT)}
          className="text-stone-500 text-sm flex items-center gap-1 hover:text-orange-600"
        >
          <i className="fa-solid fa-globe"></i>
          {language}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentView === ViewState.HOME && <Home language={language} uxText={uxText} />}
        {currentView === ViewState.READ && <Read language={language} uxText={uxText} />}
        {currentView === ViewState.DISCOVER && <Discover />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 flex justify-around items-center h-16 px-4 z-50">
        <NavButton 
          active={currentView === ViewState.HOME} 
          onClick={() => setCurrentView(ViewState.HOME)} 
          icon="fa-house" 
          label="Home" 
        />
        <NavButton 
          active={currentView === ViewState.READ} 
          onClick={() => setCurrentView(ViewState.READ)} 
          icon="fa-book-open" 
          label="Read" 
        />
        <NavButton 
          active={currentView === ViewState.DISCOVER} 
          onClick={() => setCurrentView(ViewState.DISCOVER)} 
          icon="fa-compass" 
          label="Discover" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
  >
    <i className={`fa-solid ${icon} text-lg`}></i>
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;
