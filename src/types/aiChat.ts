// AI Chat Type Definitions

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AISource[];
  relatedQuestions?: string[];
  timestamp: Date;
  tokens?: number;
  confidence?: number;
  isLoading?: boolean;
  error?: string;
}

export interface AISource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  citationNumber: number;
}

export interface AIChatRequest {
  query: string;
  conversationHistory?: ConversationMessage[];
  maxSources?: number;
  temperature?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  answer: string;
  sources: AISource[];
  relatedQuestions: string[];
  conversationId: string;
  confidence: number;
  tokensUsed?: number;
  processingTime: number;
}

