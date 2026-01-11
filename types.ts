
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
  life_lesson: string;
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
  core_theme: string;
  spiritual_takeaway: string;
}

export interface DiscoverContent {
  videos: string[];
  articles: string[];
  meditations: string[];
  topics: string[];
}

export interface UXText {
  tagline: string;
  quote_title: string;
  read_heading: string;
  discover_heading: string;
  empty_message: string;
}

export enum ViewState {
  HOME = 'HOME',
  READ = 'READ',
  DISCOVER = 'DISCOVER',
  LANGUAGE_SELECT = 'LANGUAGE_SELECT'
}
