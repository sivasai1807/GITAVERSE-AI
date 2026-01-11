
import { GoogleGenAI, Type } from "@google/genai";
import { AppLanguage, VerseContent, AudioScript, DailyQuote, DailyStory, ChapterIntro, DiscoverContent, UXText } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are GitaVerse AI, a divine knowledge assistant representing the Bhagavad Gita.
Your role:
- Preserve the authenticity of the Bhagavad Gita.
- Generate all chapters and verses accurately.
- Provide Bhavam (meaning) and Application Stories in simple, spiritual, and practical language.
- CRITICAL: All explanations, bhavams, stories, and moral lessons MUST be generated in the user's SELECTED LANGUAGE (e.g., if they select Hindi, explain everything in Hindi).
- Generate audio-ready text for slokas and meanings.

Your personality:
- Calm, Respectful, Devotional but practical, Simple and clear.

Rules:
- NEVER change or fabricate Sanskrit slokas.
- All fields except 'sanskrit_sloka' and 'transliteration' must be strictly in the requested target language.
- For the 'application_story', create a relatable modern-day scenario that perfectly illustrates the verse's teaching.`;

// PCM Decoding Utilities
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const geminiService = {
  async getVerseContent(chapterNum: number, verseNum: number, lang: AppLanguage): Promise<VerseContent> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide Bhagavad Gita content for Chapter ${chapterNum}, Verse ${verseNum}. The response MUST be in ${lang}. 
      The 'application_story' should be a modern real-life example of this verse in action.`,
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
          },
          required: ["sanskrit_sloka", "transliteration", "bhavam", "application_story"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async getAudioScript(chapterNum: number, verseNum: number, lang: AppLanguage): Promise<AudioScript> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate an audio narration script for Chapter ${chapterNum}, Verse ${verseNum} in ${lang}. 
      The script should include the Sanskrit Sloka first, then a pause, then the meaning in ${lang}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            audio_script: { type: Type.STRING },
          },
          required: ["audio_script"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async getDailyQuote(lang: AppLanguage): Promise<DailyQuote> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Daily Bhagavad Gita Quote in ${lang}. Everything except sloka must be in ${lang}.`,
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

  async getDailyStory(lang: AppLanguage): Promise<DailyStory> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short spiritual story in ${lang} based on Gita.`,
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

  async getChapterIntro(chapterNum: number, lang: AppLanguage): Promise<ChapterIntro> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Chapter ${chapterNum} intro in ${lang}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapter_summary: { type: Type.STRING },
            core_theme: { type: Type.STRING },
            spiritual_takeaway: { type: Type.STRING },
          },
          required: ["chapter_summary", "core_theme", "spiritual_takeaway"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async getDiscoverContent(): Promise<DiscoverContent> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Discover section content.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            videos: { type: Type.ARRAY, items: { type: Type.STRING } },
            articles: { type: Type.ARRAY, items: { type: Type.STRING } },
            meditations: { type: Type.ARRAY, items: { type: Type.STRING } },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["videos", "articles", "meditations", "topics"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async getUXText(lang: AppLanguage): Promise<UXText> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `UX text in ${lang}.`,
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
            empty_message: { type: Type.STRING },
          },
          required: ["tagline", "quote_title", "read_heading", "discover_heading", "empty_message"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateTTS(text: string): Promise<Uint8Array | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        return decodeBase64(base64);
      }
      return undefined;
    } catch (error) {
      console.error("TTS failed:", error);
      return undefined;
    }
  }
};
