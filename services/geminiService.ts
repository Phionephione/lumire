
import { GoogleGenAI, Type } from "@google/genai";
import { SkinAnalysis, FoundationShade, GroundingSource, ChatMessage } from "../types";

class QuotaManager {
  private static instance: QuotaManager;
  private lastCallTime: number = 0;
  private globalCooldownUntil: number = 0;
  private MIN_GAP_MS = 10000;

  private constructor() {}

  public static getInstance(): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager();
    }
    return QuotaManager.instance;
  }

  public async throttle() {
    const now = Date.now();
    if (now < this.globalCooldownUntil) {
      throw new Error(`QUOTA_LOCK:${Math.ceil((this.globalCooldownUntil - now) / 1000)}`);
    }
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.MIN_GAP_MS) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_GAP_MS - timeSinceLastCall));
    }
    this.lastCallTime = Date.now();
  }

  public triggerGlobalLock(seconds: number = 60) {
    this.globalCooldownUntil = Date.now() + (seconds * 1000);
  }
}

const quota = QuotaManager.getInstance();
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const trackFaceLive = async (base64Frame: string): Promise<SkinAnalysis> => {
  await quota.throttle();
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Frame, mimeType: 'image/jpeg' } },
          { text: "Act as a professional dermatologist and makeup artist. Analyze the face in the image. Determine the exact skin tone (Fair, Medium, Deep, etc.), undertone (Cool, Warm, Neutral), and a brief professional description of their skin type. JSON format only." }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            undertone: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['tone', 'undertone', 'description']
        }
      }
    });
    // Landmarks are now handled by local 468-point mesh, so we just return analysis
    const result = JSON.parse(response.text || '{}');
    return { ...result, landmarks: null }; // Landmarks null as they aren't needed from Gemini anymore
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      quota.triggerGlobalLock(65);
    }
    throw error;
  }
};

export const searchBrandShades = async (brand: string): Promise<{ shades: FoundationShade[], sources: GroundingSource[] }> => {
  await quota.throttle();
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the current collection of foundation shades for the brand "${brand}". Extract real names, hex codes, and purchase URLs. JSON list format.`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));

    const shades: FoundationShade[] = [
      { id: '1', name: 'Alabaster', hex: '#FDF5E6', brand, buyUrl: sources[0]?.uri || '#' },
      { id: '2', name: 'Nude', hex: '#F5E6D3', brand, buyUrl: sources[0]?.uri || '#' },
      { id: '3', name: 'Honey', hex: '#D2B48C', brand, buyUrl: sources[0]?.uri || '#' },
      { id: '4', name: 'Mocha', hex: '#4B2C20', brand, buyUrl: sources[0]?.uri || '#' },
    ];

    return { shades, sources };
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      quota.triggerGlobalLock(90);
    }
    throw error;
  }
};

export const chatWithGemini = async (message: string, history: ChatMessage[]): Promise<string> => {
  await quota.throttle();
  try {
    const ai = getAI();
    const contents = history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
    contents.push({ role: 'user', parts: [{ text: message }] });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction: "You are Lumi, a professional beauty advisor. You are sophisticated, expert in cosmetics, and very helpful." }
    });
    return response.text || "";
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      quota.triggerGlobalLock(45);
    }
    throw error;
  }
};
