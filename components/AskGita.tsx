
import React, { useState, useRef, useEffect } from 'react';
import { geminiService, decodeAudioData } from '../services/geminiService';
import { GitaResponse } from '../types';

const FALLBACK_LOGO = "https://images.unsplash.com/photo-1590059392655-08e826b1f237?q=80&w=400&auto=format&fit=crop";

const AskGita: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'gita'; content: any; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
    }
    setPlayingIndex(null);
  };

  const playDivineVani = async (index: number, response: GitaResponse) => {
    if (playingIndex === index) {
      stopAudio();
      return;
    }

    stopAudio();
    setLoadingAudioIndex(index);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      // Combine sloka and solution for reading
      const script = response.sloka_text ? `Sloka: ${response.sloka_text}. My guidance: ${response.solution}` : response.solution;

      const pcmData = await geminiService.generateTTS(script);
      if (pcmData) {
        const audioBuffer = await decodeAudioData(pcmData, ctx);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingIndex(null);
        
        setLoadingAudioIndex(null);
        setPlayingIndex(index);
        source.start(0);
        sourceNodeRef.current = source;
      } else {
        setLoadingAudioIndex(null);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setLoadingAudioIndex(null);
      setPlayingIndex(null);
    }
  };

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
    <div className="flex flex-col min-h-full px-4 max-w-2xl mx-auto relative">
      <div className="flex-1 space-y-10 pb-40">
        {messages.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center animate-fade-in">
            <div className="relative mb-10 group">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-[60px] opacity-10"></div>
              <div className="w-48 h-48 rounded-full overflow-hidden border-[10px] border-white bg-white relative z-10 shadow-2xl divine-aura">
                <img 
                  src={FALLBACK_LOGO} 
                  alt="Divine Avatar" 
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-2 rounded-full shadow-xl border border-stone-800 flex items-center gap-2 z-20">
                <i className="fa-solid fa-wand-magic-sparkles text-orange-400 text-xs"></i>
                <span className="cinzel text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Sacred Sanctuary</span>
              </div>
            </div>
            
            <h2 className="cinzel text-3xl font-black text-stone-900 tracking-tighter mb-4">Divine Counsel</h2>
            <p className="text-stone-500 text-sm max-w-xs mx-auto italic leading-relaxed mb-10">
              "Surrender all duties to Me and seek shelter in Me alone. I will liberate you from all sins."
            </p>
            
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              <p className="text-[9px] uppercase tracking-[0.3em] font-black text-orange-600/60 mb-1">Seek Guidance</p>
              <button onClick={() => setInput("How do I stay calm in chaos?")} className="flex items-center gap-4 bg-white border border-orange-50 p-5 rounded-[2rem] text-left hover:border-orange-500 hover:shadow-lg transition-all group active:scale-95">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <i className="fa-solid fa-wind text-sm"></i>
                </div>
                <span className="text-xs font-black text-stone-800 tracking-tight uppercase">Calmness in Crisis</span>
              </button>
              <button onClick={() => setInput("What is my true purpose?")} className="flex items-center gap-4 bg-white border border-orange-50 p-5 rounded-[2rem] text-left hover:border-orange-500 hover:shadow-lg transition-all group active:scale-95">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <i className="fa-solid fa-compass text-sm"></i>
                </div>
                <span className="text-xs font-black text-stone-800 tracking-tight uppercase">Discovering Purpose</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="flex flex-col items-end max-w-[85%] group">
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-xl shadow-orange-100 text-[14px] font-bold leading-relaxed border border-white/10">
                  {msg.content}
                </div>
                <span className="text-[9px] text-stone-400 font-black mt-2 mr-3 uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                  {msg.timestamp}
                </span>
              </div>
            ) : (
              <div className="flex gap-4 items-start max-w-[98%] group">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0 bg-white ring-1 ring-orange-100 flex items-center justify-center divine-aura">
                  <img src={FALLBACK_LOGO} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                  <div className="bg-white border border-stone-100 rounded-[2.5rem] rounded-tl-none shadow-sm overflow-hidden">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-stone-50 pb-4">
                        <div className="flex items-center gap-2">
                           <span className="cinzel text-[10px] font-black text-stone-900 tracking-[0.2em] uppercase">Vani of Krishna</span>
                           <button 
                            onClick={() => playDivineVani(i, msg.content)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${playingIndex === i ? 'bg-orange-600 text-white animate-pulse shadow-lg' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                            disabled={loadingAudioIndex === i}
                          >
                            {loadingAudioIndex === i ? (
                              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                            ) : (
                              <i className={`fa-solid ${playingIndex === i ? 'fa-volume-high' : 'fa-volume-low'} text-xs`}></i>
                            )}
                          </button>
                        </div>
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase tracking-widest">Verse {msg.content.verse_reference}</span>
                      </div>
                      
                      <p className="text-stone-900 leading-[1.7] text-[16px] font-medium font-serif italic">
                        "{msg.content.solution}"
                      </p>
                      
                      {msg.content.sloka_text && (
                        <div className="bg-[#fffdf9] p-6 rounded-[2rem] border border-orange-100 shadow-inner">
                          <p className="sanskrit text-xl md:text-2xl text-stone-900 leading-loose text-center italic">{msg.content.sloka_text}</p>
                        </div>
                      )}
                      
                      <div className="bg-stone-900 text-white p-6 rounded-[2rem] flex gap-4 items-start border-l-4 border-orange-500">
                        <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center flex-shrink-0 text-orange-400">
                          <i className="fa-solid fa-dharmachakra text-xl"></i>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[9px] uppercase font-black tracking-widest text-orange-500">The Path Ahead</h4>
                          <p className="text-[13px] leading-relaxed text-stone-200 font-medium">{msg.content.guidance}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 px-4">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                      Divine Light • {msg.timestamp}
                    </span>
                    {playingIndex === i && (
                      <div className="flex gap-0.5 items-end h-2">
                        <div className="w-0.5 bg-orange-400 animate-[bounce_0.6s_infinite] h-full"></div>
                        <div className="w-0.5 bg-orange-400 animate-[bounce_0.8s_infinite] h-2/3"></div>
                        <div className="w-0.5 bg-orange-400 animate-[bounce_0.7s_infinite] h-1/2"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-4 pl-0 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-md divine-aura overflow-hidden">
               <img src={FALLBACK_LOGO} alt="Loading" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-orange-50 px-6 py-4 rounded-[1.8rem] rounded-tl-none italic text-stone-400 text-[11px] font-bold tracking-wide">
              Preparing your guidance...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} className="h-4" />
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
        <form 
          onSubmit={handleSend} 
          className="max-w-2xl mx-auto flex items-center gap-3 p-2 bg-white/90 backdrop-blur-3xl border border-white rounded-[4rem] shadow-xl ring-1 ring-orange-50 focus-within:ring-orange-400 focus-within:ring-2 transition-all group"
        >
          <div className="flex items-center justify-center pl-3">
             <div className="w-10 h-10 rounded-full overflow-hidden border border-orange-100 bg-white flex items-center justify-center">
                <img src={FALLBACK_LOGO} alt="Input Logo" className="w-full h-full object-cover" />
             </div>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your dilemma..."
            className="flex-1 bg-transparent border-none rounded-full px-2 py-3 text-[15px] font-bold focus:outline-none placeholder:text-stone-300 italic"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all shadow-lg disabled:opacity-20"
          >
            <i className="fa-solid fa-paper-plane text-lg"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AskGita;
