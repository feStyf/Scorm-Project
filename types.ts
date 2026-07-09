export interface FileContext {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface Lesson {
  id: string;
  title: string;
  type?: 'article' | 'quiz' | 'flashcards';
  content?: string;
  imageUrl?: string;
  imagePrompt?: string;
  isLoading?: boolean;
  statusMessage?: string; // New field for specific agent status
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  language: string;
  targetAudience: string;
  contextFiles: FileContext[];
  docUrl?: string;
}

// Using const object instead of enum to avoid runtime syntax errors in some environments
export const GenerationStep = {
  IDLE: 'IDLE',
  OUTLINE: 'OUTLINE',
  CONTENT: 'CONTENT',
  COMPLETED: 'COMPLETED'
} as const;

export type GenerationStep = typeof GenerationStep[keyof typeof GenerationStep];