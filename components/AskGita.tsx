
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { GitaResponse } from '../types';

const DIVINE_LOGO_PATH = "logo krishna.jpg"; 
const FALLBACK_LOGO = "https://images.unsplash.com/photo-1590059392655-08e826b1f237?q=80&w=400&auto=format&fit=crop";

const AskGita: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'gita'; content: any; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

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
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp }]);
    setIsTyping(true);

    try {
      const response = await geminiService.askGita(userMsg);
      const gitaTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'gita', content: response, timestamp: gitaTimestamp }]);
    } catch (err) {
      console.error(err);
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'gita', content: { solution: "My wisdom is vast, but the connection is currently weak. Pray again in a moment, Arjuna.", verse_reference: "Patience", sloka_text: "", guidance: "Center your spirit and retry your query." }, timestamp: errorTimestamp }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-2xl mx-auto relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0">
        <i className="fa-solid fa-om text-[30rem]"></i>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-12 px-4 pb-40 pt-10 z-10 no-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-10 flex flex-col items-center animate-fade-in">
            <div className="relative mb-14 group">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="w-52 h-52 rounded-full overflow-hidden border-[12px] border-white bg-white relative z-10 shadow-2xl divine-aura">
                <img 
                  src={DIVINE_LOGO_PATH} 
                  alt="Divine Avatar" 
                  className="w-full h-full object-cover scale-110 object-center transition-all duration-700" 
                  onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
                />
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-8 py-3 rounded-full shadow-2xl border-2 border-stone-800 flex items-center gap-3 z-20">
                <i className="fa-solid fa-wand-magic-sparkles text-orange-400"></i>
                <span className="cinzel text-[11px] font-black uppercase tracking-[0.2em]">Sanctuary of Peace</span>
              </div>
            </div>
            
            <h2 className="cinzel text-4xl font-black text-stone-900 tracking-tighter mb-5">Seek Divine Counsel</h2>
            <p className="text-stone-500 text-sm max-w-sm mx-auto italic leading-relaxed mb-12">
              "Tell me your dilemmas, Arjuna. The words of the Gita shall light your way through the darkness."
            </p>
            
            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
              <p className="text-[10px] uppercase tracking-[0.5em] font-black text-orange-600/60 mb-2">Sacred Starting Points</p>
              <button onClick={() => setInput("How do I stay calm in chaos?")} className="flex items-center gap-5 bg-white border border-orange-50 p-6 rounded-[2.5rem] text-left hover:border-orange-500 hover:shadow-xl transition-all group active:scale-95">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                  <i className="fa-solid fa-wind text-lg"></i>
                </div>
                <span className="text-xs font-black text-stone-800 tracking-tight uppercase">Calmness in Crisis</span>
              </button>
              <button onClick={() => setInput("What is my true purpose in life?")} className="flex items-center gap-5 bg-white border border-orange-50 p-6 rounded-[2.5rem] text-left hover:border-orange-500 hover:shadow-xl transition-all group active:scale-95">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                  <i className="fa-solid fa-compass text-lg"></i>
                </div>
                <span className="text-xs font-black text-stone-800 tracking-tight uppercase">Discovering Purpose</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="flex flex-col items-end max-w-[85%] pr-2 group">
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white px-8 py-6 rounded-[3rem] rounded-tr-none shadow-2xl shadow-orange-100 text-[15px] font-bold leading-relaxed border border-white/20">
                  {msg.content}
                </div>
                <span className="text-[10px] text-stone-400 font-black mt-3 mr-4 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Sent • {msg.timestamp}
                </span>
              </div>
            ) : (
              <div className="flex gap-5 items-start max-w-[98%] group">
                <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-white shadow-2xl flex-shrink-0 bg-white ring-2 ring-orange-100 flex items-center justify-center mt-2 overflow-hidden divine-aura">
                  <img 
                    src={DIVINE_LOGO_PATH} 
                    alt="Avatar" 
                    className="w-full h-full object-cover scale-110" 
                    onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
                  />
                </div>
                
                <div className="flex flex-col gap-3 flex-1">
                  <div className="bg-white border border-stone-100 rounded-[3rem] rounded-tl-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="p-8 space-y-8">
                      <div className="flex items-center justify-between border-b border-stone-50 pb-5">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                           <span className="cinzel text-[11px] font-black text-stone-900 tracking-[0.25em] uppercase">Vani of the Lord</span>
                        </div>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-1.5 rounded-xl uppercase tracking-widest">Gita {msg.content.verse_reference}</span>
                      </div>
                      
                      <p className="text-stone-900 leading-[1.8] text-[17px] font-medium font-serif italic relative">
                        <i className="fa-solid fa-quote-left text-orange-100 absolute -top-4 -left-6 text-4xl opacity-50"></i>
                        "{msg.content.solution}"
                      </p>
                      
                      {msg.content.sloka_text && (
                        <div className="bg-[#fffdf9] p-8 rounded-[2.5rem] border border-orange-100 shadow-inner relative group/sloka">
                          <i className="fa-solid fa-om absolute top-4 right-6 text-orange-100 text-xl opacity-30 group-hover/sloka:scale-125 transition-transform"></i>
                          <p className="sanskrit text-2xl md:text-3xl text-stone-900 leading-loose text-center italic">{msg.content.sloka_text}</p>
                        </div>
                      )}
                      
                      <div className="bg-stone-900 text-white p-7 rounded-[2.5rem] flex gap-5 items-start shadow-2xl border-l-8 border-orange-500 group/path">
                        <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center flex-shrink-0 text-orange-400 group-hover/path:rotate-12 transition-transform shadow-lg">
                          <i className="fa-solid fa-dharmachakra text-2xl"></i>
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-orange-500 mb-1">Dharmic Prescription</h4>
                          <p className="text-[14px] leading-relaxed opacity-95 text-stone-100 font-medium">{msg.content.guidance}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400 font-black ml-6 mt-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-clock text-[9px] mr-2"></i>
                    Divine Insight • {msg.timestamp}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-6 pl-6 animate-pulse">
            <div className="w-14 h-14 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-lg divine-aura overflow-hidden">
               <img src={DIVINE_LOGO_PATH} alt="Loading Krishna" className="w-full h-full object-cover scale-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-orange-50 px-8 py-5 rounded-[2rem] italic text-stone-400 text-[12px] font-bold tracking-wide shadow-sm">
              Krishna is preparing your guidance...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      {/* Floating Sacred Input Bar with Logo */}
      <div className="fixed bottom-28 left-0 right-0 px-6 z-50">
        <form 
          onSubmit={handleSend} 
          className="max-w-2xl mx-auto flex items-center gap-4 p-3 bg-white/90 backdrop-blur-3xl border border-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] ring-1 ring-orange-50 focus-within:ring-orange-400 focus-within:ring-2 transition-all group"
        >
          <div className="flex items-center justify-center pl-3">
             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-100 shadow-sm bg-white flex items-center justify-center transition-all group-focus-within:scale-110 group-focus-within:border-orange-300">
                <img 
                  src={DIVINE_LOGO_PATH} 
                  alt="Input Logo" 
                  className="w-full h-full object-cover scale-110"
                  onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
                />
             </div>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your problem... e.g., 'How to find peace?'"
            className="flex-1 bg-transparent border-none rounded-[1.8rem] px-2 py-4 text-[16px] font-bold focus:outline-none placeholder:text-stone-300 placeholder:font-medium italic"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-20 disabled:grayscale"
          >
            <i className="fa-solid fa-paper-plane text-xl"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AskGita;
