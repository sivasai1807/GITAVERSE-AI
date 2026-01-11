
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { GitaResponse } from '../types';

const AskGita: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'gita'; content: any }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  // Using the high-quality public URL for the user's preferred Krishna-Arjuna painting
  const DIVINE_LOGO_URL = "https://m.media-amazon.com/images/I/91M-1Pq-D6L._AC_UF1000,1000_QL80_.jpg";

  const scrollToBottom = () => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await geminiService.askGita(userMsg);
      setMessages(prev => [...prev, { role: 'gita', content: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'gita', content: { solution: "I am consulting the heavens. Please try again in a moment, Arjuna.", verse_reference: "Patience", sloka_text: "", guidance: "Take a deep breath and center your mind." } }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
        <i className="fa-solid fa-om text-[20rem]"></i>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pb-10 scrollbar-hide z-10">
        {messages.length === 0 && (
          <div className="text-center py-16 animate-fade-in flex flex-col items-center">
            <div className="relative mb-8">
              <div className="w-36 h-36 rounded-full overflow-hidden shadow-[0_10px_30px_rgba(244,196,48,0.4)] border-4 border-white ring-4 ring-orange-100">
                <img 
                  src={DIVINE_LOGO_URL} 
                  alt="Divine Guidance" 
                  className="w-full h-full object-cover scale-110" 
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-saffron text-white rounded-full p-3 shadow-lg border-2 border-white">
                <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
              </div>
            </div>
            <h2 className="cinzel text-2xl font-bold text-stone-800 tracking-tight">Divine Consultation</h2>
            <p className="text-stone-500 text-sm max-w-xs mx-auto mt-4 italic leading-relaxed">
              "Whatever path people travel is My path. No matter where they go, they come to Me."
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              <button onClick={() => setInput("How do I find peace in stress?")} className="text-xs bg-white border border-orange-100 p-3 rounded-2xl text-stone-600 hover:bg-orange-50 transition-colors shadow-sm">"How do I find peace in stress?"</button>
              <button onClick={() => setInput("What is the purpose of my work?")} className="text-xs bg-white border border-orange-100 p-3 rounded-2xl text-stone-600 hover:bg-orange-50 transition-colors shadow-sm">"What is the purpose of my work?"</button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="bg-orange-600 text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-lg max-w-[85%] text-sm font-medium border border-orange-500/20">
                {msg.content}
              </div>
            ) : (
              <div className="flex gap-3 max-w-[95%] items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 shadow-md flex-shrink-0 mt-1">
                   <img src={DIVINE_LOGO_URL} alt="Krishna" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white border border-orange-100 p-6 rounded-[2.5rem] rounded-tl-none shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] relative overflow-hidden backdrop-blur-sm bg-white/95">
                  <div className="flex items-center justify-between mb-4 border-b border-orange-50 pb-2">
                    <span className="cinzel text-[10px] font-bold text-orange-600 tracking-widest uppercase">Sacred Wisdom</span>
                    <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-3 py-1 rounded-full border border-stone-100 uppercase tracking-tighter">Verse {msg.content.verse_reference}</span>
                  </div>
                  
                  <p className="text-stone-800 leading-relaxed mb-6 text-base font-medium italic font-serif">
                    {msg.content.solution}
                  </p>
                  
                  {msg.content.sloka_text && (
                    <div className="bg-orange-50/70 p-5 rounded-2xl border border-orange-100 mb-6 relative group">
                      <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <p className="sanskrit text-xl text-stone-900 leading-relaxed text-center italic relative z-10">{msg.content.sloka_text}</p>
                    </div>
                  )}
                  
                  <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border-l-4 border-orange-500 shadow-xl flex gap-3 items-start">
                    <i className="fa-solid fa-map-location-dot text-orange-400 mt-1"></i>
                    <div>
                       <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-1">Divine Guidance</h4>
                       <p className="text-[12px] leading-relaxed opacity-90">{msg.content.guidance}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full border-2 border-stone-100 bg-stone-50 flex items-center justify-center">
               <i className="fa-solid fa-feather-pointed text-stone-300"></i>
            </div>
            <div className="bg-white border border-orange-100 px-6 py-3 rounded-2xl italic text-stone-400 text-xs shadow-sm">
              Krishna is preparing your path...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-3 p-3 bg-white border border-orange-100 rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(244,196,48,0.2)] relative z-20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak your heart's dilemma..."
          className="flex-1 bg-stone-50 border-none rounded-[1.8rem] px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-14 h-14 bg-orange-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-orange-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          <i className="fa-solid fa-paper-plane-top text-xl"></i>
        </button>
      </form>
    </div>
  );
};

export default AskGita;
