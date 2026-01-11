
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { GitaResponse } from '../types';

const AskGita: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'gita'; content: any }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

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
      setMessages(prev => [...prev, { role: 'gita', content: { solution: "I am consulting the heavens. Please try again in a moment, Arjuna.", verse_reference: "Patience", sloka_text: "", guidance: "" } }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-20 animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-6 shadow-xl border-2 border-orange-100">
              <img src={DIVINE_LOGO_URL} alt="Divine Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="cinzel text-xl font-bold text-stone-700">What troubles your heart today?</h2>
            <p className="text-stone-400 text-sm max-w-xs mx-auto mt-2 italic">Speak freely. The Gita holds the answer to every dilemma.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="bg-orange-600 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] text-sm font-medium">
                {msg.content}
              </div>
            ) : (
              <div className="bg-white border border-orange-100 p-6 rounded-3xl rounded-tl-none shadow-md max-w-[90%] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <i className="fa-solid fa-dharmachakra text-5xl"></i>
                </div>
                <h3 className="cinzel text-xs font-bold text-orange-600 mb-3 tracking-tighter">Voice of the Divine • {msg.content.verse_reference}</h3>
                <p className="text-stone-800 leading-relaxed mb-4 text-base font-medium">{msg.content.solution}</p>
                {msg.content.sloka_text && (
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-4">
                    <p className="sanskrit text-lg text-stone-900 leading-relaxed text-center italic">{msg.content.sloka_text}</p>
                  </div>
                )}
                <div className="flex items-start gap-2 bg-stone-900 text-stone-100 p-4 rounded-xl">
                  <i className="fa-solid fa-map-location-dot text-orange-400 mt-1"></i>
                  <p className="text-xs leading-relaxed">{msg.content.guidance}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-orange-100 px-6 py-4 rounded-2xl italic text-stone-400 text-xs flex items-center gap-3">
              <i className="fa-solid fa-feather-pointed text-orange-300"></i>
              Krishna is writing...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I feel stressed about my career..."
          className="flex-1 bg-white border border-orange-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg pr-14"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center hover:bg-orange-700 transition-colors shadow-md"
        >
          <i className="fa-solid fa-paper-plane text-xs"></i>
        </button>
      </form>
    </div>
  );
};

export default AskGita;
