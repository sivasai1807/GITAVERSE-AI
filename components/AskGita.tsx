
import React, { useState, useRef, useEffect } from 'react';
import { geminiService, decodeAudioData, getChatHistory, saveChatMessage, clearChatHistoryFromDB } from '../services/geminiService';
import { GitaResponse, AppLanguage, ChatMessage } from '../types';

const DIVINE_LOGO_PATH = "logo.png"; 
const FALLBACK_LOGO = "https://images.unsplash.com/photo-1590059392655-08e826b1f237?q=80&w=400&auto=format&fit=crop";

interface AskGitaProps {
  language: AppLanguage;
}

const AskGita: React.FC<AskGitaProps> = ({ language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Load History on Mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await getChatHistory(language);
      setMessages(history);
    };
    loadHistory();
  }, [language]);

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
      case 'Sanskrit': return "हे पार्थ, स्वकीयं सङ्कटं वर्णयतु...";
      case 'Hindi': return "हे पार्थ, अपनी जीवन-दुविधा विस्तार से बताएं...";
      case 'Telugu': return "ఓ అర్జునా, నీ మనసులోని భారాన్ని పంచుకో...";
      case 'Tamil': return "அர்ஜுனா, உன் வாழ்க்கையின் குழப்பத்தைப் பகிரவும்...";
      case 'Malayalam': return "അർജുനാ, നിങ്ങളുടെ ഹൃദയഭാരം എന്നോട് പറയൂ...";
      case 'Kannada': return "ಪಾರ್ಥ, ನಿನ್ನ ಜೀವನದ ಸಂದಿಗ್ಧತೆಯನ್ನು ಹಂಚಿಕೊ...";
      case 'Bengali': return "হে পার্থ, তোমার জীবনের সমস্যার কথা বলো...";
      default: return "Arjuna, share the burden of your soul with me...";
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

  const clearHistory = async () => {
    if (window.confirm("Do you wish to clear these scrolls of conversation?")) {
      await clearChatHistoryFromDB(language);
      setMessages([]);
    }
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
    const messageId = Date.now().toString();
    
    const newUserMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: userMsg,
      timestamp,
      language
    };

    setInput('');
    setMessages(prev => [...prev, newUserMessage]);
    await saveChatMessage(newUserMessage);
    setIsTyping(true);

    try {
      const response = await geminiService.askGita(userMsg, language);
      const gitaTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const gitaMessageId = (Date.now() + 1).toString();
      
      const newGitaMessage: ChatMessage = {
        id: gitaMessageId,
        role: 'gita',
        content: response,
        timestamp: gitaTimestamp,
        language
      };

      setMessages(prev => [...prev, newGitaMessage]);
      await saveChatMessage(newGitaMessage);
    } catch (err) {
      console.error(err);
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorGitaMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'gita',
        content: { 
          solution: "The divine frequency is faint. Pray once more, Arjuna.", 
          verse_reference: "Dharma", 
          sloka_text: "", 
          guidance: "Seek clarity in silence and retry." 
        },
        timestamp: errorTimestamp,
        language
      };
      setMessages(prev => [...prev, errorGitaMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-stone-50/20">
      {/* Header Info / Clear Actions */}
      <div className="flex-none px-6 py-2 flex justify-between items-center z-10 bg-white/50 backdrop-blur-md border-b border-orange-100/30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Divine Connection Active</span>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-[9px] font-black text-stone-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <i className="fa-solid fa-trash-can text-[10px]"></i>
            Clear Scrolls
          </button>
        )}
      </div>

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
        <img src={DIVINE_LOGO_PATH} alt="" className="w-[70%] max-w-md grayscale" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-8 pb-40">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 mt-12 animate-fade-in px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-[60px] opacity-10 scale-150 animate-pulse"></div>
              <img 
                src={DIVINE_LOGO_PATH} 
                className="w-36 h-36 object-cover rounded-full border-[6px] border-white shadow-2xl relative z-10"
                alt="Divine Avatar"
                onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
              />
            </div>
            <div className="space-y-4 max-w-sm">
              <h2 className="cinzel text-3xl font-black text-stone-900 tracking-tight">{getDivineTitle(language)}</h2>
              <p className="text-stone-500 italic text-sm leading-relaxed font-medium">
                "Arjuna, the ripples on the surface do not reveal the depths. Share with me the storm in your heart, and I shall illuminate it."
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full max-w-xs pt-4">
              <button onClick={() => setInput("I feel lost and don't know my purpose.")} className="p-4 bg-white/90 backdrop-blur-sm border border-stone-100 rounded-2xl text-left text-[11px] font-black text-stone-600 hover:border-orange-400 hover:shadow-lg transition-all active:scale-95">
                <i className="fa-solid fa-compass text-orange-400 mr-2 opacity-60"></i> I feel lost and don't know my purpose.
              </button>
              <button onClick={() => setInput("How do I handle the betrayal of a loved one?")} className="p-4 bg-white/90 backdrop-blur-sm border border-stone-100 rounded-2xl text-left text-[11px] font-black text-stone-600 hover:border-orange-400 hover:shadow-lg transition-all active:scale-95">
                <i className="fa-solid fa-heart-crack text-orange-400 mr-2 opacity-60"></i> How do I handle betrayal?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] flex flex-col items-end">
                <div className="bg-stone-900 text-white px-6 py-4 rounded-[2.2rem] rounded-tr-none shadow-xl text-sm font-medium leading-relaxed">
                  {msg.content as string}
                </div>
                <span className="text-[9px] text-stone-400 mt-2 mr-3 font-black opacity-50 uppercase tracking-widest">{msg.timestamp}</span>
              </div>
            ) : (
              <div className="max-w-[95%] flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex-shrink-0 flex items-center justify-center border border-orange-50 overflow-hidden mt-1 ring-2 ring-orange-50/50">
                   <img src={DIVINE_LOGO_PATH} className="w-full h-full object-cover scale-150" alt="Gita" onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }} />
                </div>
                <div className="flex flex-col space-y-3 flex-1">
                  <div className="bg-white border border-orange-50/50 p-6 rounded-[2.8rem] rounded-tl-none shadow-2xl shadow-orange-900/5 ring-1 ring-orange-100/10">
                    {typeof msg.content === 'object' ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-stone-50 pb-4">
                          <span className="cinzel text-[10px] font-black text-orange-600 uppercase tracking-widest">{getDivineTitle(language)}</span>
                          <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                            {msg.content.verse_reference}
                          </span>
                        </div>
                        <div className="space-y-4">
                          <p className="text-stone-800 text-[15px] leading-relaxed italic font-medium">
                            "{msg.content.solution}"
                          </p>
                          {msg.content.sloka_text && (
                            <div className="bg-orange-50/40 p-6 rounded-3xl border border-orange-100/30">
                              <p className="sanskrit text-xl text-stone-900 text-center leading-loose tracking-wide">
                                {msg.content.sloka_text}
                              </p>
                            </div>
                          )}
                          <div className="pt-2 flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <i className="fa-solid fa-dharmachakra text-orange-400 text-xs"></i>
                             </div>
                             <p className="text-[11px] text-stone-500 font-bold leading-relaxed italic pt-1 opacity-80">
                                {msg.content.guidance}
                             </p>
                          </div>
                        </div>
                        <div className="pt-5 border-t border-stone-50 flex justify-center">
                          <button 
                            onClick={() => playDivineVani(i, msg.content as GitaResponse)}
                            disabled={loadingAudioIndex === i}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-500 shadow-sm active:scale-95 border ${
                              playingIndex === i 
                                ? 'bg-orange-600 text-white border-orange-500 animate-pulse' 
                                : 'bg-white text-orange-600 border-orange-100 hover:bg-orange-50 hover:border-orange-200'
                            }`}
                          >
                            {loadingAudioIndex === i ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <i className={`fa-solid ${playingIndex === i ? 'fa-pause' : 'fa-play'}`}></i>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                              {playingIndex === i ? "Silence Vani" : getAudioButtonLabel(language)}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-stone-800 text-[15px] leading-relaxed italic font-medium">{msg.content}</p>
                        <div className="pt-4 border-t border-stone-50 flex justify-center">
                          <button 
                            onClick={() => playDivineVani(i, msg.content as string)}
                            disabled={loadingAudioIndex === i}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-500 shadow-sm active:scale-95 border ${
                              playingIndex === i 
                                ? 'bg-orange-600 text-white border-orange-500 animate-pulse' 
                                : 'bg-white text-orange-600 border-orange-100 hover:bg-orange-50 hover:border-orange-200'
                            }`}
                          >
                            {loadingAudioIndex === i ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <i className={`fa-solid ${playingIndex === i ? 'fa-pause' : 'fa-play'}`}></i>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                              {getAudioButtonLabel(language)}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-stone-400 ml-4 font-black opacity-50 uppercase tracking-widest">{msg.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 items-center pl-2 animate-fade-in">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-orange-50 overflow-hidden ring-2 ring-orange-100/50">
                 <img src={DIVINE_LOGO_PATH} className="w-full h-full object-cover scale-150 animate-spin-slow" alt="Thinking" onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }} />
              </div>
              <div className="absolute -inset-1 bg-orange-400/20 rounded-full blur-md animate-pulse"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3.5 rounded-full text-[11px] italic text-stone-500 font-black border border-orange-50/50 shadow-sm uppercase tracking-[0.15em] flex items-center gap-3">
              <span>Krishna is reading your heart</span>
              <div className="flex gap-1 items-center h-full pt-1">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      {/* Input Bar - Fixed Visual Glitch (Removed Rectangular Border) */}
      <div className="fixed bottom-24 left-0 right-0 px-4 pb-6 z-40 flex justify-center">
        <div className={`max-w-2xl w-full transition-all duration-500 ${isFocused ? 'scale-[1.01]' : 'scale-100'}`}>
           <div 
            className={`flex items-center gap-1 p-1 bg-white/95 backdrop-blur-2xl rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border transition-all duration-500 relative group overflow-hidden ${isFocused ? 'border-orange-300 ring-4 ring-orange-400/5' : 'border-stone-100 ring-1 ring-black/5'}`}
          >
            {/* Input Aura */}
            {isFocused && (
              <div className="absolute inset-0 rounded-full bg-orange-500/5 animate-pulse pointer-events-none"></div>
            )}

            <div className={`w-12 h-12 rounded-full overflow-hidden border border-stone-100/50 flex-shrink-0 ml-1 transition-all duration-700 bg-white flex items-center justify-center ${isFocused ? 'scale-90 shadow-[0_0_15px_rgba(234,88,12,0.3)] rotate-6' : 'scale-100'}`}>
               <img src={DIVINE_LOGO_PATH} className="w-full h-full object-cover scale-150" alt="Icon" onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }} />
            </div>
            
            <form onSubmit={handleSend} className="flex-1 flex items-center m-0 p-0 border-none outline-none">
              <input 
                type="text"
                value={input}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getPlaceholderText(language)}
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none text-sm font-bold text-stone-800 placeholder:text-stone-400/70 px-4 py-4 appearance-none"
                disabled={isTyping}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              />
              
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 flex-shrink-0 mr-1 ${input.trim() && !isTyping ? 'bg-orange-600 text-white scale-100 rotate-0 shadow-orange-600/20' : 'bg-stone-50 text-stone-200 scale-90 -rotate-12'}`}
              >
                <i className="fa-solid fa-feather-pointed text-lg"></i>
              </button>
            </form>
          </div>
          
          {/* Subtle Tip */}
          {!isFocused && messages.length === 0 && (
            <p className="text-center mt-3 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 animate-fade-in pointer-events-none select-none">
              "When you seek clarity, the universe answers."
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskGita;
