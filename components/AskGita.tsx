
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { GitaResponse } from '../types';

const AskGita: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'gita'; content: any }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  // The provided image as the Divine Logo
  const GITA_LOGO = "https://images.unsplash.com/photo-1626012629452-957262f277a8?auto=format&fit=crop&q=80&w=800"; // Placeholder for the Krishna image style if we can't use raw binary
  // Actual prompt provided image reference (conceptual)
  const DIVINE_ICON = "https://img.icons8.com/external-flat-icons-inmotus-design/100/external-Om-yoga-flat-icons-inmotus-design.png";

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
      setMessages(prev => [...prev, { role: 'gita', content: { solution: "My child, your thoughts are clouded. Rest your mind and ask again.", verse_reference: "Dhyana", sloka_text: "", guidance: "" } }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-2xl mx-auto p-4 relative">
      {/* Subtle Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <i className="fa-solid fa-dharmachakra text-[20rem]"></i>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6 scrollbar-hide z-10">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
             <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-orange-100 overflow-hidden shadow-2xl mx-auto bg-orange-50">
                   <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Krishna_Arjuna.jpg/800px-Krishna_Arjuna.jpg" 
                    alt="Divine Logo" 
                    className="w-full h-full object-cover scale-110"
                   />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-orange-100">
                  <i className="fa-solid fa-wand-sparkles text-orange-500 text-sm"></i>
                </div>
             </div>
            <h2 className="cinzel text-xl font-bold text-stone-800">Celestial Dialogue</h2>
            <p className="text-stone-500 text-xs max-w-xs mx-auto mt-3 italic leading-relaxed">
              "Tell Me what is bothering you, Arjuna. I shall dispel your darkness with the lamp of knowledge."
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="bg-orange-600 text-white px-5 py-3 rounded-3xl rounded-tr-none shadow-md max-w-[85%] text-sm font-medium border border-orange-500/20">
                {msg.content}
              </div>
            ) : (
              <div className="flex gap-3 max-w-[92%] items-start">
                <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center shadow-lg border border-orange-400 overflow-hidden mt-1">
                   <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Krishna_Arjuna.jpg/800px-Krishna_Arjuna.jpg" 
                    alt="K" 
                    className="w-full h-full object-cover"
                   />
                </div>
                <div className="bg-white border border-orange-100 p-5 rounded-3xl rounded-tl-none shadow-xl relative backdrop-blur-sm bg-white/95">
                  <div className="flex items-center justify-between mb-3 border-b border-orange-50 pb-2">
                    <span className="cinzel text-[10px] font-extrabold text-orange-600 tracking-wider">Divine Decree</span>
                    <span className="text-[10px] font-bold text-stone-400 opacity-60 px-2 py-0.5 bg-stone-50 rounded-full">{msg.content.verse_reference}</span>
                  </div>
                  
                  <p className="text-stone-800 leading-relaxed mb-4 text-[15px] font-serif italic">
                    {msg.content.solution}
                  </p>
                  
                  {msg.content.sloka_text && (
                    <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-100/50 mb-4 text-center">
                      <p className="sanskrit text-lg text-stone-900 leading-relaxed">{msg.content.sloka_text}</p>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 bg-stone-900 text-stone-100 p-4 rounded-2xl border-l-4 border-orange-500">
                    <i className="fa-solid fa-compass-drafting text-orange-400 mt-1 text-sm"></i>
                    <p className="text-[11px] leading-relaxed font-medium opacity-90">{msg.content.guidance}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
               <i className="fa-solid fa-feather-pointed text-orange-400"></i>
            </div>
            <div className="bg-white border border-orange-100 px-5 py-3 rounded-2xl italic text-stone-400 text-xs">
              Krishna is pondering...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-3 p-2 bg-white/50 backdrop-blur-md rounded-[2rem] border border-orange-100 shadow-xl relative z-20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak your heart's dilemma..."
          className="flex-1 bg-white/80 border-none rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
        />
        <button
          type="submit"
          className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-700 transition-all shadow-lg active:scale-90"
        >
          <i className="fa-solid fa-paper-plane-top text-lg"></i>
        </button>
      </form>
    </div>
  );
};

export default AskGita;
