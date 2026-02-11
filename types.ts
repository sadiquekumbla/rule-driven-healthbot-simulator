
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thought?: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    name?: string;
  };
}

export interface MediaTrigger {
  id: string;
  keyword: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  botReply: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  minBmi?: number;
  maxBmi?: number;
  category: string; // Changed from fixed union to string to allow manual entry
  duration: string;
  essentials: string[];
}

export interface TrainingExample {
  id: string;
  userPrompt: string;
  botResponse: string;
}

export interface ConversationContext {
  age: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bmiCategory: string | null;
  medicalConditions: string | null;
  suggestedCourse: string | null;
  priceQuote: string | null;
  stage: string;
}

export interface Client {
  id: string;
  name: string;
  messages: Message[];
  context: ConversationContext;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  isEnabled: boolean;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: 'emerald' | 'blue' | 'indigo' | 'rose' | 'slate';
}

export interface AdminRules {
  systemPrompt: string;
  botName: string;
  priceTable: string;
  apiProvider: 'gemini' | 'openai' | 'deepseek' | 'claude';
  engineMode: 'flash' | 'reasoning' | 'deepseek';
  temperature: number;
  topP: number;
  topK: number;
  trainingExamples: TrainingExample[];
  whatsappConfig: WhatsAppConfig;
  theme: ThemeConfig;
  mediaTriggers: MediaTrigger[];
}
