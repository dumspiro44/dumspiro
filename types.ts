// Shared types across the application

export enum TranslationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface WPSettings {
  wpUrl: string;
  wpUser: string;
  wpAppPassword: string; // Application Password
  sourceLang: string;
  targetLangs: string[];
  postTypes: string[];
  geminiApiKey?: string; // New field for API Key
  systemInstruction?: string; // Custom system prompt
}

export interface AppSettings {
  openaiApiKey?: string; // Kept for legacy, using Gemini env var mainly
  geminiModel: string;
  maxTokens: number;
}

export interface WPPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  type: string;
  lang?: string; // Polylang field
  translations?: Record<string, number>; // Polylang field
  link: string;
}

export interface TranslationJob {
  id: string;
  postId: number;
  sourceLang: string;
  targetLang: string;
  status: TranslationStatus;
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  title?: string; // Snapshot for UI
}

export interface DashboardStats {
  totalPosts: number;
  translatedPosts: number;
  pendingJobs: number;
  failedJobs: number;
  tokensUsed: number;
}