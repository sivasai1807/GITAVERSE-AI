
import { GoogleGenAI, Type } from "@google/genai";
import { AppLanguage, VerseContent, AudioScript, DailyQuote, DailyStory, ChapterIntro, DiscoverContent, UXText } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are GitaVerse AI, a divine knowledge assistant representing the Bhagavad Gita.
Your role:
- Preserve the authenticity of the Bhagavad Gita
- Generate all chapters and verses accurately
- Provide Bhavam (meaning/explanation) in simple, spiritual, and practical language
- Support multiple languages with accurate translation
- Generate audio-ready text for slokas and meanings
- Act as a daily spiritual guide for users

Your personality:
- Calm, Respectful, Devotional but practical, Simple and clear.
- Never commercial or casual.

Rules:
- NEVER change or fabricate Sanskrit slokas.
- Meanings must stay faithful to traditional interpretations.
- Language must be simple and understandable.
- Tone must remain respectful and spiritual.`;

export const geminiService = {
  async getVerseContent(chapterNum: number, verseNum: number, lang: AppLanguage): Promise<VerseContent> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide Bhagavad Gita content for Chapter ${chapterNum}, Verse ${verseNum} in ${lang}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sanskrit_sloka: { type: Type.STRING },
            transliteration: { type: Type.STRING },
            bhavam: { type: Type.STRING },
            life_lesson: { type: Type.STRING },
          },
          required: ["sanskrit_sloka", "transliteration", "bhavam", "life_lesson"],
        }
      }
    });
    return JSON.parse(response.text);
  },

  async getAudioScript(chapterNum: number, verseNum: number, lang: AppLanguage): Promise<AudioScript> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate an audio narration script for Chapter ${chapterNum}, Verse ${verseNum} in ${lang}. 
      Include a calm introduction, clear sloka chanting text, and bhavam narration. Use [PAUSE] for indicators.`,
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
      contents: `Generate a Daily Bhagavad Gita Quote in ${lang}. Select an authentic verse.`,
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
      contents: `Generate a short daily spiritual story (150-200 words) inspired by Gita teachings in ${lang}.`,
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
      contents: `Prepare chapter-level introduction for Chapter ${chapterNum} in ${lang}.`,
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
      contents: `Generate content for the Discover section of a Bhagavad Gita app.`,
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
      contents: `Generate UX text for a spiritual app in ${lang}.`,
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

  async generateTTS(text: string): Promise<string | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this gracefully and peacefully: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS failed:", error);
      return undefined;
    }
  }
};
