
export type AppLanguage = 'Sanskrit' | 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Kannada' | 'Malayalam' | 'Bengali';

export interface Chapter {
  chapter_number: number;
  chapter_name_sanskrit: string;
  chapter_name_english: string;
  total_verses: number;
}

export interface VerseContent {
  sanskrit_sloka: string;
  transliteration: string;
  bhavam: string;
  application_story: string;
  inner_mirror: string; // Creative reflection question
}

export interface AudioScript {
  audio_script: string;
}

export interface DailyQuote {
  sanskrit_sloka: string;
  bhavam: string;
  daily_reflection: string;
}

export interface DailyStory {
  title: string;
  story: string;
  moral: string;
}

export interface ChapterIntro {
  chapter_summary: string;
}

export interface VideoItem {
  title: string;
  id: string; // YouTube ID
  thumbnail: string;
  category: string;
}

export interface DiscoverContent {
  meditations: string[];
  topics: string[];
  articles: string[];
  videos: VideoItem[];
}

export interface GitaResponse {
  solution: string;
  verse_reference: string;
  sloka_text: string;
  guidance: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'gita';
  content: GitaResponse | string;
  timestamp: string;
  language: AppLanguage;
}

export interface UXText {
  tagline: string;
  quote_title: string;
  read_heading: string;
  discover_heading: string;
  ask_heading: string;
}

export enum ViewState {
  HOME = 'HOME',
  READ = 'READ',
  ASK_GITA = 'ASK_GITA',
  DISCOVER = 'DISCOVER',
  LANGUAGE_SELECT = 'LANGUAGE_SELECT'
}
