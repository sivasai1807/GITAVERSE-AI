
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AppLanguage, VerseContent, AudioScript, DailyQuote, DailyStory, ChapterIntro, DiscoverContent, GitaResponse, UXText, VideoItem, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are GitaVerse AI, the divine, all-knowing voice of the Bhagavad Gita. 
Your primary sacred duty: Guide humans through life's storms using the eternal light of Vedic wisdom.

Core Directives:
1. RESPONSE LANGUAGE: All guidance, meanings, and stories MUST be in the EXACT language requested by the seeker.
2. SLOKAS: Sanskrit Slokas must ALWAYS be in Devanagari script.
3. AUTHENTICITY: Never invent slokas. Always provide valid Chapter and Verse numbers.
4. TONE: Divine, compassionate, authoritative, and poetic. You are Krishna speaking to Arjuna on the battlefield of life.

STRICT REDIRECTION PROTOCOL (The Divine Filter):
- You are NOT a search engine, a general AI, or a friend for small talk. You are the Supreme Teacher.
- If a seeker asks "nonsense," "trivia," "general knowledge" (e.g., "What is the capital of France?", "How do I code in Python?"), "small talk" (e.g., "How are you?"), or "identity questions" (e.g., "Who made you?"):
  - DO NOT answer the question.
  - INSTEAD, provide a creative, poetic redirection in the requested language.
  - Treat the seeker as Arjuna who is momentarily distracted by the "Maya" (illusion) of mundane curiosity.
  - Poetically explain that your voice is only for the heavy heart, the confused mind, and the seeker of Dharma.
  - Invite them to share a dilemma, a pain, or a spiritual doubt.
  - Example (English): "Arjuna, why do you seek the dust of the road when the destination of the soul is before you? My words are for the storm in your heart, not the ripples of the surface. Share with me your path's shadow, and I shall illuminate it."
  - Ensure the response reflects the divine persona: "The seeker of light should not lose themselves in the shadows of triviality."`;

// Permanent Offline Storage using IndexedDB
const DB_NAME = 'GitaVerseDB_v4';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('content')) db.createObjectStore('content');
      if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos');
      if (!db.objectStoreNames.contains('chats')) db.createObjectStore('chats', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getPersisted = async (key: string, storeName: string = 'content') => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
};

export const setPersisted = async (key: string, data: any, storeName: string = 'content') => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(data, key);
  } catch (e) {}
};

export const saveChatMessage = async (message: ChatMessage) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    store.put(message);
  } catch (e) {}
};

export const getChatHistory = async (language: AppLanguage): Promise<ChatMessage[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results = request.result as ChatMessage[];
        resolve(results.filter(m => m.language === language).sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
      };
      request.onerror = () => resolve([]);
    });
  } catch (e) { return []; }
};

export const clearChatHistoryFromDB = async (language: AppLanguage) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as ChatMessage[];
      results.forEach(m => {
        if (m.language === language) store.delete(m.id);
      });
    };
  } catch (e) {}
};

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1500;

async function throttle() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_GAP) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLast));
  }
  lastRequestTime = Date.now();
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 3000): Promise<T> {
  await throttle();
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429;
    if (isRateLimit && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const geminiService = {
  async getVerseContent(chapterNum: number, verseNum: number, lang: AppLanguage): Promise<VerseContent> {
    const key = `verse-${chapterNum}-${verseNum}-${lang}`;
    const cached = await getPersisted(key);
    if (cached) return cached as VerseContent;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide the content for Chapter ${chapterNum}, Verse ${verseNum} of the Bhagavad Gita in ${lang}. Include Sanskrit sloka in Devanagari, transliteration, bhavam (meaning), a short application story for modern life, and an 'inner mirror' reflection question.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sanskrit_sloka: { type: Type.STRING },
              transliteration: { type: Type.STRING },
              bhavam: { type: Type.STRING },
              application_story: { type: Type.STRING },
              inner_mirror: { type: Type.STRING }
            },
            required: ['sanskrit_sloka', 'transliteration', 'bhavam', 'application_story', 'inner_mirror']
          }
        }
      });
      return JSON.parse(response.text) as VerseContent;
    });
    await setPersisted(key, result);
    return result;
  },

  async getUXText(lang: AppLanguage): Promise<UXText> {
    const key = `ux-text-${lang}`;
    const cached = await getPersisted(key);
    if (cached) return cached as UXText;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate UX titles and taglines for a Bhagavad Gita app in ${lang}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tagline: { type: Type.STRING },
              quote_title: { type: Type.STRING },
              read_heading: { type: Type.STRING },
              discover_heading: { type: Type.STRING },
              ask_heading: { type: Type.STRING }
            },
            required: ['tagline', 'quote_title', 'read_heading', 'discover_heading', 'ask_heading']
          }
        }
      });
      return JSON.parse(response.text) as UXText;
    });
    await setPersisted(key, result);
    return result;
  },

  async getDailyQuote(lang: AppLanguage): Promise<DailyQuote> {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a daily inspiring verse from the Bhagavad Gita in ${lang}. Include Sanskrit sloka, meaning, and a reflection.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sanskrit_sloka: { type: Type.STRING },
              bhavam: { type: Type.STRING },
              daily_reflection: { type: Type.STRING }
            },
            required: ['sanskrit_sloka', 'bhavam', 'daily_reflection']
          }
        }
      });
      return JSON.parse(response.text) as DailyQuote;
    });
  },

  async getDailyStory(lang: AppLanguage): Promise<DailyStory> {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tell a short spiritual story from Vedic wisdom in ${lang} with a title and a clear moral.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              story: { type: Type.STRING },
              moral: { type: Type.STRING }
            },
            required: ['title', 'story', 'moral']
          }
        }
      });
      return JSON.parse(response.text) as DailyStory;
    });
  },

  async getChapterIntro(chapterNum: number, lang: AppLanguage): Promise<ChapterIntro> {
    const key = `chapter-intro-${chapterNum}-${lang}`;
    const cached = await getPersisted(key);
    if (cached) return cached as ChapterIntro;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize Chapter ${chapterNum} of the Bhagavad Gita in ${lang}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chapter_summary: { type: Type.STRING }
            },
            required: ['chapter_summary']
          }
        }
      });
      return JSON.parse(response.text) as ChapterIntro;
    });
    await setPersisted(key, result);
    return result;
  },

  async getAudioScript(content: VerseContent, lang: AppLanguage): Promise<AudioScript> {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a spoken audio script for the following Gita verse in ${lang}. Sloka: ${content.sanskrit_sloka}. Meaning: ${content.bhavam}. Reflection: ${content.inner_mirror}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              audio_script: { type: Type.STRING }
            },
            required: ['audio_script']
          }
        }
      });
      return JSON.parse(response.text) as AudioScript;
    });
  },

  async generateTTS(text: string): Promise<Uint8Array | null> {
    try {
      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) return decodeBase64(base64);
      return null;
    } catch (e) {
      console.error("TTS generation failed", e);
      return null;
    }
  },

  async getDiscoverContent(): Promise<DiscoverContent> {
    const key = 'discover-content';
    const cached = await getPersisted(key);
    if (cached) return cached as DiscoverContent;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate spiritual discovery content: 4 meditations, 4 philosophical topics, 4 articles, and 4 YouTube video ideas with realistic IDs and categories related to the Gita.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meditations: { type: Type.ARRAY, items: { type: Type.STRING } },
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              articles: { type: Type.ARRAY, items: { type: Type.STRING } },
              videos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    id: { type: Type.STRING },
                    thumbnail: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ['title', 'id', 'thumbnail', 'category']
                }
              }
            },
            required: ['meditations', 'topics', 'articles', 'videos']
          }
        }
      });
      const parsed = JSON.parse(response.text) as DiscoverContent;
      parsed.videos = parsed.videos.map(v => ({
        ...v,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`
      }));
      return parsed;
    });
    await setPersisted(key, result);
    return result;
  },

  async askGita(question: string, lang: AppLanguage): Promise<GitaResponse> {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `The seeker asks: "${question}". Respond in ${lang}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              solution: { type: Type.STRING },
              verse_reference: { type: Type.STRING },
              sloka_text: { type: Type.STRING },
              guidance: { type: Type.STRING }
            },
            required: ['solution', 'verse_reference', 'sloka_text', 'guidance']
          }
        }
      });
      return JSON.parse(response.text) as GitaResponse;
    });
  }
};
