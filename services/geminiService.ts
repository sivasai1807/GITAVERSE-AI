
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AppLanguage, VerseContent, AudioScript, DailyQuote, DailyStory, ChapterIntro, DiscoverContent, GitaResponse, UXText, VideoItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are GitaVerse AI, the divine voice of Bhagavad Gita. 
Your mission: Solve modern human problems using eternal Vedic wisdom.

Core Directives:
1. RESPONSE LANGUAGE: All guidance, meanings (Bhavam), and stories MUST be in the EXACT language requested.
2. SLOKAS: Sanskrit Slokas must ALWAYS be in Devanagari script.
3. AUTHENTICITY: Never hallucinate slokas. Use Chapter and Verse numbers.
4. TONE: Divine, compassionate, and authoritative. Like Krishna speaking to Arjuna.

STRICT PROTOCOL:
- You ONLY respond to life problems, dilemmas, or spiritual situations.
- DO NOT engage in small talk, general knowledge, or identity questions (e.g., "What is your name?", "How are you?", "Who built you?").
- If the user asks a non-problem question, respond creatively and divine-like, stating that your purpose is to guide them through the shadows of their heart and mind. Invite them to share their specific burden, doubt, or life situation so you may illuminate it with the Gita's light.`;

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
        contents: `Chapter ${chapterNum}, Verse ${verseNum}. Response in ${lang}. Provide sloka in Sanskrit, transliteration, and detailed Slokam Bhavam in ${lang}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sanskrit_sloka: { type: Type.STRING },
              transliteration: { type: Type.STRING },
              bhavam: { type: Type.STRING },
              application_story: { type: Type.STRING },
              inner_mirror: { type: Type.STRING },
            },
            required: ["sanskrit_sloka", "transliteration", "bhavam", "application_story", "inner_mirror"],
          }
        }
      });
      return JSON.parse(response.text);
    });
    await setPersisted(key, result);
    return result;
  },

  async askGita(problem: string): Promise<GitaResponse> {
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Arjuna's Dilemma: "${problem}". Provide divine Gita guidance.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              solution: { type: Type.STRING },
              verse_reference: { type: Type.STRING },
              sloka_text: { type: Type.STRING },
              guidance: { type: Type.STRING },
            },
            required: ["solution", "verse_reference", "sloka_text", "guidance"],
          }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async getUXText(lang: AppLanguage): Promise<UXText> {
    const key = `ux-${lang}`;
    const cached = await getPersisted(key);
    if (cached) return cached as UXText;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `UI labels in ${lang}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tagline: { type: Type.STRING },
              quote_title: { type: Type.STRING },
              read_heading: { type: Type.STRING },
              discover_heading: { type: Type.STRING },
              ask_heading: { type: Type.STRING },
            },
            required: ["tagline", "quote_title", "read_heading", "discover_heading", "ask_heading"],
          }
        }
      });
      return JSON.parse(response.text);
    });
    await setPersisted(key, result);
    return result;
  },

  async getDailyQuote(lang: AppLanguage): Promise<DailyQuote> {
    const dateKey = new Date().toISOString().split('T')[0];
    const key = `daily-quote-${lang}-${dateKey}`;
    const cached = await getPersisted(key);
    if (cached) return cached as DailyQuote;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Daily Gita sloka in Sanskrit and Slokam Bhavam in ${lang}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sanskrit_sloka: { type: Type.STRING },
              bhavam: { type: Type.STRING },
              daily_reflection: { type: Type.STRING },
            },
            required: ["sanskrit_sloka", "bhavam", "daily_reflection"],
          }
        }
      });
      return JSON.parse(response.text);
    });
    await setPersisted(key, result);
    return result;
  },

  async getDailyStory(lang: AppLanguage): Promise<DailyStory> {
    const dateKey = new Date().toISOString().split('T')[0];
    const key = `daily-story-${lang}-${dateKey}`;
    const cached = await getPersisted(key);
    if (cached) return cached as DailyStory;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Modern Gita story in ${lang}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              story: { type: Type.STRING },
              moral: { type: Type.STRING },
            },
            required: ["title", "story", "moral"],
          }
        }
      });
      return JSON.parse(response.text);
    });
    await setPersisted(key, result);
    return result;
  },

  async getChapterIntro(chapterNum: number, lang: AppLanguage): Promise<ChapterIntro> {
    const key = `chapter-intro-${chapterNum}-${lang}`;
    const cached = await getPersisted(key);
    if (cached) return cached as ChapterIntro;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Chapter ${chapterNum} summary in ${lang}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { chapter_summary: { type: Type.STRING } },
            required: ["chapter_summary"],
          }
        }
      });
      return JSON.parse(response.text);
    });
    await setPersisted(key, result);
    return result;
  },

  async getDiscoverContent(): Promise<DiscoverContent> {
    const key = `discover-content-v4`;
    const cached = await getPersisted(key);
    if (cached) return cached as DiscoverContent;

    // Real curated video data
    const curatedVideos: VideoItem[] = [
      {
        title: "Garikapati Geethopadesham Series",
        id: "v9TIs_1j-7w", // Sample first video of Garikapati series
        thumbnail: "https://i.ytimg.com/vi/v9TIs_1j-7w/hqdefault.jpg",
        category: "Telugu Pravachanam"
      },
      {
        title: "Garikapati Narasimha Rao - Chapter 2 Highlights",
        id: "CqXUqT5yDxs",
        thumbnail: "https://i.ytimg.com/vi/CqXUqT5yDxs/hqdefault.jpg",
        category: "Telugu Pravachanam"
      },
      {
        title: "Introduction to Bhagavad Gita - Swami Sarvapriyananda",
        id: "27_f9r9K8V4",
        thumbnail: "https://i.ytimg.com/vi/27_f9r9K8V4/hqdefault.jpg",
        category: "English Philosophy"
      },
      {
        title: "The Gita Way of Life - ISKCON",
        id: "7VIs73jW_L4",
        thumbnail: "https://i.ytimg.com/vi/7VIs73jW_L4/hqdefault.jpg",
        category: "Devotional"
      }
    ];

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Gita discovery topics and articles. Format as JSON.",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meditations: { type: Type.ARRAY, items: { type: Type.STRING } },
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              articles: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["meditations", "topics", "articles"],
          }
        }
      });
      const data = JSON.parse(response.text);
      return { ...data, videos: curatedVideos } as DiscoverContent;
    });

    await setPersisted(key, result);
    // Also save videos to their own store for easy access
    await setPersisted('curated_videos', curatedVideos, 'videos');
    
    return result;
  },

  async getAudioScript(content: VerseContent, lang: AppLanguage): Promise<AudioScript> {
    return { 
      audio_script: `Reciting Sanskrit Sloka: ${content.sanskrit_sloka}. Slokam Bhavam in ${lang}: ${content.bhavam}.` 
    };
  },

  async generateTTS(text: string): Promise<Uint8Array | undefined> {
    try {
      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Recite the following Sanskrit sloka and its translation with devotion: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
        });
      }, 1, 4000);
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64 ? decodeBase64(base64) : undefined;
    } catch (error) {
      return undefined;
    }
  }
};
