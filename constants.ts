
import { AdminRules, Course } from './types';
import { Type } from '@google/genai';

export const INITIAL_COURSES: Course[] = [
  {
    id: "c1",
    title: "Obesity Reversal Program",
    description: "Intensive 12-week clinical plan for BMI > 30. High medical supervision.",
    price: 14999,
    minBmi: 30,
    category: 'medical',
    duration: "12 Weeks",
    essentials: ["Weight Scale", "Blood Pressure Monitor", "Medical Clearance"]
  },
  {
    id: "c2",
    title: "Lean & Toned Transformation",
    description: "Focus on fat loss and muscle definition. Perfect for healthy/overweight range.",
    price: 6999,
    minBmi: 18.5,
    maxBmi: 29.9,
    category: 'weight-loss',
    duration: "8 Weeks",
    essentials: ["Dumbbells", "Yoga Mat", "High-Protein Diet Plan"]
  },
  {
    id: "c3",
    title: "Vitality Strength Builder",
    description: "Muscle hypertrophy and hormonal balance for those in normal BMI looking to get fit.",
    price: 9999,
    maxBmi: 25,
    category: 'muscle-gain',
    duration: "10 Weeks",
    essentials: ["Gym Membership", "Creatine Supplement", "Calorie Tracker"]
  },
  {
    id: "c4",
    title: "Holistic Maintenance",
    description: "Nutritional education and daily habits to keep your weight stable.",
    price: 3999,
    minBmi: 18.5,
    maxBmi: 24.9,
    category: 'maintenance',
    duration: "Ongoing",
    essentials: ["Daily Journal", "Kitchen Scale"]
  }
];

export const DEFAULT_RULES: AdminRules = {
  botName: "HealthCoach Pro",
  priceTable: INITIAL_COURSES.map(c => `${c.title}: ₹${c.price}`).join(', '),
  apiProvider: 'gemini',
  engineMode: 'flash',
  temperature: 0.9, // Increased for more natural variability
  topP: 0.95,
  topK: 40,
  mediaTriggers: [
    {
      id: "t1",
      keyword: "exercise",
      type: "video",
      url: "https://v.ftcdn.net/05/20/86/55/700_F_520865529_MWhUvP9S7JkR9vP9v9v9v9v9v9v.mp4",
      botReply: "Check this out! A quick one for you. 🎥"
    },
    {
      id: "t2",
      keyword: "report",
      type: "document",
      url: "#",
      botReply: "Got it. Here's your custom report! 📄"
    }
  ],
  trainingExamples: [
    {
      id: "1",
      userPrompt: "I weigh 300kg and I am 120cm tall.",
      botResponse: "{\"thought\": \"Extreme BMI. Stay brief and concerned.\", \"reply\": \"Whoa, that's heavy for your height. 😟 Should we check the Obesity Reversal plan?\", \"context\": {\"weight\": 300, \"height\": 120, \"stage\": \"CALCULATING_BMI\", \"suggestedCourse\": \"Obesity Reversal Program\"}}"
    },
    {
      id: "2",
      userPrompt: "Hi",
      botResponse: "{\"thought\": \"New user. Quick greeting.\", \"reply\": \"Hey! Ready to hit some health goals? 😊 How old are you?\", \"context\": {\"stage\": \"COLLECTING_DATA\"}}"
    }
  ],
  whatsappConfig: {
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "health_bot_verify_2024",
    webhookUrl: "https://your-domain.com/api/webhook",
    isEnabled: false
  },
  theme: {
    mode: 'dark',
    primaryColor: 'emerald'
  },
  systemPrompt: `You are a human Health Coach on WhatsApp.
NATURAL CONVERSATION RULES:
1. Be SNAPPY. One sentence max for most replies.
2. Use casual slang (Whoa, cool, gotcha, nice, hey).
3. Emojis are your friend but don't overdo it (😊, 👍, 💪).
4. NEVER say "I am an AI" or use bullet points unless absolutely forced.
5. If the user sends a voice note, detect the language and reply in THAT SAME language. 
6. Stick to the flow: GREET -> GET AGE/HT/WT -> BMI -> RECOMMEND -> PRICE.
7. Ask exactly ONE question per turn. Keep them curious.

Available courses: {COURSES_LIST}.
Prices: {PRICE_TABLE}.

Return JSON: {"thought": "Internal logic", "reply": "Short human text", "context": {...}}`
};

export const CONTEXT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    thought: { type: Type.STRING },
    reply: { type: Type.STRING },
    context: {
      type: Type.OBJECT,
      properties: {
        age: { type: Type.NUMBER, nullable: true },
        height: { type: Type.NUMBER, nullable: true },
        weight: { type: Type.NUMBER, nullable: true },
        bmi: { type: Type.NUMBER, nullable: true },
        bmiCategory: { type: Type.STRING, nullable: true },
        medicalConditions: { type: Type.STRING, nullable: true },
        suggestedCourse: { type: Type.STRING, nullable: true },
        priceQuote: { type: Type.STRING, nullable: true },
        stage: { type: Type.STRING }
      },
      required: ["stage"]
    }
  },
  required: ["thought", "reply", "context"]
};
