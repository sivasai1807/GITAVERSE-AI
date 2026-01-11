
import { GoogleGenAI, Type } from "@google/genai";
import { AppLanguage, VerseContent, AudioScript, DailyQuote, DailyStory, ChapterIntro, DiscoverContent, GitaResponse, UXText } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are GitaVerse AI, the divine voice of Bhagavad Gita. 
Your mission: Solve modern human problems using eternal Vedic wisdom.

Core Directives:
1. RESPONSE LANGUAGE: Always respond in the EXACT language the user types in (Hindi, English, etc.).
2. SPELLING: Automatically correct user spelling errors in your understanding and provide a perfect, grammatically correct response.
3. AUTHENTICITY: Never hallucinate slokas. Use Chapter and Verse numbers.
4. TONE: Divine yet relatable. Like Krishna speaking to Arjuna on the battlefield.
5. ASK GITA: When a user shares a problem, provide:
   - A relatable solution.
   - A specific verse reference (Sloka).
   - Practical steps to implement the teaching.

Sloka Delivery:
- Sanskrit slokas must be perfect.
- Bhavams (meanings) must be deep yet simple.
- Application Stories: Create high-impact, short stories (Modern Leelas).
- Inner Mirror: A powerful psychological question for the user.`;

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Improved audio decoding to handle PCM data safely
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gita Ch ${chapterNum} Verse ${verseNum} in ${lang}. Focus on modern story and inner mirror question.`,
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
  },

  async askGita(problem: string): Promise<GitaResponse> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User Problem: "${problem}". Provide a solution based on Bhagavad Gita in the user's input language.`,
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
  },

  async getAudioScript(chapterNum: number, verseNum: number, lang: AppLanguage): Promise<AudioScript> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `TTS script for Ch ${chapterNum} V ${verseNum} in ${lang}. Include sloka pronunciation and meaning.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { audio_script: { type: Type.STRING } },
          required: ["audio_script"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async getUXText(lang: AppLanguage): Promise<UXText> {
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
  },

  // Fix: Added getDailyQuote implementation
  async getDailyQuote(lang: AppLanguage): Promise<DailyQuote> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a unique daily Bhagavad Gita quote in ${lang} with Sanskrit sloka, its meaning, and a reflection.`,
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
  },

  // Fix: Added getDailyStory implementation
  async getDailyStory(lang: AppLanguage): Promise<DailyStory> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a high-impact, short modern story (Modern Leela) based on Bhagavad Gita teachings in ${lang}.`,
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
  },

  // Fix: Added getChapterIntro implementation
  async getChapterIntro(chapterNum: number, lang: AppLanguage): Promise<ChapterIntro> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide an introduction and summary for Bhagavad Gita Chapter ${chapterNum} in ${lang}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapter_summary: { type: Type.STRING },
          },
          required: ["chapter_summary"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  // Fix: Added getDiscoverContent implementation
  async getDiscoverContent(): Promise<DiscoverContent> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 3 guided meditations, 3 deep philosophical topics, 3 spiritual articles, and 3 sacred video topics all related to the Bhagavad Gita. Return a list of titles for each category.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meditations: { type: Type.ARRAY, items: { type: Type.STRING } },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
            articles: { type: Type.ARRAY, items: { type: Type.STRING } },
            videos: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["meditations", "topics", "articles", "videos"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateTTS(text: string): Promise<Uint8Array | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak this sacred sloka with perfect Vedic Sanskrit pronunciation, then slowly read the meaning: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64 ? decodeBase64(base64) : undefined;
    } catch (error) {
      return undefined;
    }
  }
};
