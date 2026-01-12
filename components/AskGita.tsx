
import React, { useState, useRef, useEffect } from 'react';
import { geminiService, decodeAudioData } from '../services/geminiService';
import { GitaResponse, AppLanguage } from '../types';

const DIVINE_LOGO_PATH = "logo.png"; 
const FALLBACK_LOGO = "https://images.unsplash.com/photo-1590059392655-08e826b1f237?q=80&w=400&auto=format&fit=crop";

interface AskGitaProps {
  language: AppLanguage;
}

const AskGita: React.FC<AskGitaProps> = ({ language }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'gita'; content: GitaResponse | string; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Creative Localized Titles
  const getDivineTitle = (lang: AppLanguage) => {
    switch (lang) {
      case 'Sanskrit': return 'भगवद्वाणी';
      case 'Hindi': return 'कृष्ण वाणी';
      case 'Telugu': return 'కృష్ణ వాణి';
      case 'Tamil': return 'கிருஷ்ண மொழி';
      case 'Malayalam': return 'കൃഷ്ണ മൊഴി';
      case 'Kannada': return 'ಕೃಷ್ಣ ವಾಣಿ';
      case 'Bengali': return 'কৃষ্ণ বাণী';
      default: return "Krishna's Oracle";
    }
  };

  const getPlaceholderText = (lang: AppLanguage) => {
    switch (lang) {
      case 'Telugu': return "మీ పరిస్థితిని తెలియజేయండి...";
      case 'Hindi': return "अपनी दुविधा साझा करें...";
      default: return "Share your situation or doubt...";
    }
  };

  const getAudioButtonLabel = (lang: AppLanguage) => {
    switch (lang) {
      case 'Telugu': return "దైవ వాణి వినండి";
      case 'Hindi': return "दिव्य वाणी सुनें";
      default: return "Listen to Divine Voice";
    }
  };

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

  const playDivineVani = async (index: number, content: GitaResponse | string) => {
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

      let script = "";
      if (typeof content === 'string') {
        script = content;
      } else {
        script = content.sloka_text 
          ? `Reciting Sloka: ${content.sloka_text}. Meaning: ${content.solution}`
          : content.solution;
      }

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
      setMessages(prev => [...prev, { role: 'gita', content: { solution: "The divine frequency is faint. Pray once more, Arjuna.", verse_reference: "Dharma", sloka_text: "", guidance: "Seek clarity in silence and retry." }, timestamp: errorTimestamp }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-orange-50/20">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <img src={DIVINE_LOGO_PATH} alt="Watermark" className="w-[80%] max-w-lg grayscale" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-8 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 mt-12 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-3xl opacity-20 scale-150 divine-aura"></div>
              <img 
                src={DIVINE_LOGO_PATH} 
                className="w-40 h-40 object-cover rounded-full border-4 border-white shadow-2xl relative z-10"
                alt="Divine Avatar"
                onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
              />
            </div>
            <div className="space-y-4 max-w-sm">
              <h2 className="cinzel text-3xl font-black text-stone-900">{getDivineTitle(language)}</h2>
              <p className="text-stone-500 italic text-sm leading-relaxed">
                "Small talk is for the ego, but a dilemma is for the soul. Share the burden of your heart, and let the Gita be your light."
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full max-w-xs pt-4">
              <button onClick={() => setInput("I feel lost and don't know my purpose.")} className="p-4 bg-white/80 backdrop-blur-sm border border-orange-100 rounded-2xl text-left text-xs font-bold text-stone-700 hover:border-orange-400 transition-all shadow-sm">
                I feel lost and don't know my purpose.
              </button>
              <button onClick={() => setInput("How do I handle the betrayal of a loved one?")} className="p-4 bg-white/80 backdrop-blur-sm border border-orange-100 rounded-2xl text-left text-xs font-bold text-stone-700 hover:border-orange-400 transition-all shadow-sm">
                How do I handle betrayal?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] flex flex-col items-end">
                <div className="bg-stone-900 text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-xl text-sm font-medium">
                  {msg.content as string}
                </div>
                <span className="text-[10px] text-stone-400 mt-2 mr-2 font-bold opacity-60 uppercase">{msg.timestamp}</span>
              </div>
            ) : (
              <div className="max-w-[95%] flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-white shadow-lg flex-shrink-0 flex items-center justify-center border border-orange-100 overflow-hidden">
                   <img src={DIVINE_LOGO_PATH} className="w-full h-full object-cover scale-150" alt="Gita" onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }} />
                </div>
                <div className="flex flex-col space-y-3 flex-1">
                  <div className="bg-white border border-orange-50 p-6 rounded-[2.5rem] rounded-tl-none shadow-2xl shadow-orange-900/5">
                    {typeof msg.content === 'object' ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-orange-50 pb-4">
                          <span className="cinzel text-[10px] font-black text-orange-600 uppercase tracking-widest">{getDivineTitle(language)}</span>
                          <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                            {msg.content.verse_reference}
                          </span>
                        </div>

                        <div className="space-y-4">
                          <p className="text-stone-800 text-base leading-relaxed italic font-medium">
                            "{msg.content.solution}"
                          </p>
                          
                          {msg.content.sloka_text && (
                            <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50">
                              <p className="sanskrit text-xl text-stone-900 text-center leading-loose">
                                {msg.content.sloka_text}
                              </p>
                            </div>
                          )}

                          <div className="pt-4 flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-dharmachakra text-orange-400 text-xs"></i>
                             </div>
                             <p className="text-xs text-stone-500 font-medium leading-relaxed italic pt-1">
                                {msg.content.guidance}
                             </p>
                          </div>
                        </div>

                        {/* Play Aloud Button */}
                        <div className="pt-4 border-t border-orange-50 flex justify-center">
                          <button 
                            onClick={() => playDivineVani(i, msg.content as GitaResponse)}
                            disabled={loadingAudioIndex === i}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 shadow-sm active:scale-95 ${
                              playingIndex === i 
                                ? 'bg-orange-600 text-white animate-pulse' 
                                : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'
                            }`}
                          >
                            {loadingAudioIndex === i ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <i className={`fa-solid ${playingIndex === i ? 'fa-pause' : 'fa-play'}`}></i>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {playingIndex === i ? "Silence Vani" : getAudioButtonLabel(language)}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-stone-800 text-sm leading-relaxed italic font-medium">{msg.content}</p>
                        <div className="pt-4 border-t border-orange-50 flex justify-center">
                          <button 
                            onClick={() => playDivineVani(i, msg.content as string)}
                            disabled={loadingAudioIndex === i}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 shadow-sm active:scale-95 ${
                              playingIndex === i 
                                ? 'bg-orange-600 text-white animate-pulse' 
                                : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'
                            }`}
                          >
                            {loadingAudioIndex === i ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <i className={`fa-solid ${playingIndex === i ? 'fa-pause' : 'fa-play'}`}></i>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {getAudioButtonLabel(language)}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 ml-4 font-bold opacity-60 uppercase">{msg.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 items-center pl-2 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border border-orange-100 overflow-hidden">
               <img src={DIVINE_LOGO_PATH} className="w-full h-full object-cover scale-150" alt="Thinking" onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }} />
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full text-xs italic text-stone-400 font-bold border border-orange-50">
              Krishna is preparing your guidance...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-24 left-0 right-0 px-4 pb-4 z-40 flex justify-center">
        <div className="max-w-2xl w-full">
           <form 
            onSubmit={handleSend}
            className="flex items-center gap-3 p-2 bg-white/95 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-orange-50 ring-1 ring-black/5"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border border-orange-50 flex-shrink-0 ml-1">
               <img src={DIVINE_LOGO_PATH} className="w-full h-full object-cover scale-150" alt="Icon" onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }} />
            </div>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholderText(language)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-stone-800 placeholder:text-stone-300 px-2"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${input.trim() && !isTyping ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-300'}`}
            >
              <i className="fa-solid fa-arrow-up text-lg"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskGita;
