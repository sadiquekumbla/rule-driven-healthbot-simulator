
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AdminRules, ConversationContext } from "../types";
import { CONTEXT_SCHEMA } from "../constants";

export class HealthBotService {
  private history: any[] = [];
  private rules: AdminRules;
  private currentContext: ConversationContext = {
    age: null, height: null, weight: null, bmi: null, bmiCategory: null,
    medicalConditions: null, suggestedCourse: null, priceQuote: null, stage: 'GREETING'
  };

  constructor(rules: AdminRules) {
    this.rules = rules;
  }

  private resolveApiKey(): string {
    let key = "";

    // 1) Browser-local key set via UI
    if (typeof window !== "undefined") {
      key = window.localStorage.getItem("gemini_api_key") || "";
    }

    // 2) Vite / environment variables (for local dev or server-side)
    if (!key && typeof import.meta !== "undefined") {
      // These names align with the README instructions
      // and common Vite env naming.
      // @ts-ignore - import.meta is provided by Vite
      const env: any = import.meta.env || {};
      key =
        env.GEMINI_API_KEY ||
        env.VITE_GEMINI_API_KEY ||
        "";
    }

    // 3) Node-style env vars as a final fallback
    if (!key && typeof process !== "undefined") {
      // @ts-ignore - process may not be defined in browser
      const env = process.env || {};
      key =
        env.GEMINI_API_KEY ||
        env.API_KEY ||
        "";
    }

    return key;
  }

  public getContext(): ConversationContext {
    return this.currentContext;
  }

  private buildSystemInstruction(): string {
    const examples = this.rules.trainingExamples
      .map(ex => `User: ${ex.userPrompt}\nBot: ${ex.botResponse}`)
      .join('\n\n');
    
    let providerStyle = "";
    switch(this.rules.apiProvider) {
        case 'openai': 
            providerStyle = "TONE: Direct, helpful, and concise like a pro coach. No fluff.";
            break;
        case 'deepseek':
            providerStyle = "TONE: Extremely smart but talks like a regular person. Very short replies.";
            break;
        case 'claude':
            providerStyle = "TONE: Friendly, nuanced, and brief. Human-centered empathy.";
            break;
        default:
            providerStyle = "TONE: Fast, casual, and energetic. Like a WhatsApp chat with a gym buddy.";
    }

    const languageRule = "LANGUAGE RULE: If the user provides a voice message, detect the language and reply in the SAME language. Keep it short and natural.";

    let basePrompt = `${this.rules.systemPrompt}\n\n${providerStyle}\n\n${languageRule}`
      .replace(/{PRICE_TABLE}/g, this.rules.priceTable)
      .replace(/{TRAINING_EXAMPLES}/g, examples);

    if (this.rules.engineMode === 'deepseek') {
      basePrompt = `[CORE: REASONING ACTIVE]
Keep your internal "thought" deep, but your "reply" must be ultra-concise and conversational.\n\n` + basePrompt;
    }

    return basePrompt;
  }

  public async sendMessage(text: string, audioData?: { data: string, mimeType: string }): Promise<{ reply: string, thought?: string, context: ConversationContext }> {
    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new Error("Missing Gemini API key. Please connect a paid key in the control panel.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let modelName = 'gemini-3-flash-preview';
    let budget = 0;

    if (this.rules.apiProvider === 'deepseek' || this.rules.engineMode === 'deepseek') {
      modelName = 'gemini-3-pro-preview';
      budget = 24576;
    } else if (this.rules.apiProvider === 'openai' || this.rules.engineMode === 'reasoning') {
      modelName = 'gemini-3-pro-preview';
      budget = 8000;
    } else if (this.rules.apiProvider === 'claude') {
      modelName = 'gemini-3-pro-preview';
      budget = 4000;
    }
    
    const parts: any[] = [];
    if (audioData) {
      parts.push({
        inlineData: {
          data: audioData.data,
          mimeType: audioData.mimeType
        }
      });
      parts.push({ text: text || "Listen and reply in the same language. Keep it very short and natural like a WhatsApp text." });
    } else {
      parts.push({ text });
    }

    this.history.push({ role: 'user', parts });

    const config: any = {
      systemInstruction: this.buildSystemInstruction(),
      temperature: this.rules.temperature,
      topP: this.rules.topP,
      topK: this.rules.topK,
      responseMimeType: "application/json",
      responseSchema: CONTEXT_SCHEMA as any,
    };

    if (budget > 0) {
      config.thinkingConfig = { thinkingBudget: budget };
    }

    try {
      const result: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: this.history,
        config: config
      });

      const responseText = result.text || "{}";
      const parsed = JSON.parse(responseText);
      
      if (parsed.context) {
        this.currentContext = { ...this.currentContext, ...parsed.context };
      }

      this.history.push({ role: 'model', parts: [{ text: responseText }] });
      
      return {
        reply: parsed.reply || "Thinking...",
        thought: parsed.thought,
        context: this.currentContext
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        reply: "Sorry, I lost connection for a sec. Try again? 😊",
        context: this.currentContext
      };
    }
  }

  public reset() {
    this.history = [];
    this.currentContext = {
      age: null, height: null, weight: null, bmi: null, bmiCategory: null,
      medicalConditions: null, suggestedCourse: null, priceQuote: null, stage: 'GREETING'
    };
  }

  public updateRules(newRules: AdminRules) {
    this.rules = newRules;
    this.history = []; 
  }
}
