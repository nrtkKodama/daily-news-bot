export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url?: string;
  source?: string;
  category: string;
  relevanceScore: number; // 0-100
  reasonForSelection: string;
  publishedDate?: string;
}

export interface UserPreferences {
  likedCategories: string[];
  dislikedCategories: string[];
  keywords: string[];
  webhookUrl: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SlackPayload {
  text: string;
  blocks?: any[];
}
