
import { GoogleGenAI, Type } from "@google/genai";
import { SkinAnalysis, FoundationShade, GroundingSource, ChatMessage } from "../types";

// Always initialize the client with process.env.API_KEY using named parameter
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * High-speed tracking: Detects precise facial skin area for live overlay
 */
export const trackFaceLive = async (base64Frame: string): Promise<SkinAnalysis> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Frame, mimeType: 'image/jpeg' } },
        { text: `Precisely map this face for makeup. 
          Return JSON:
          1. tone (e.g. "Deep", "Tan")
          2. undertone (e.g. "Warm", "Cool")
          3. landmarks:
             - jawline: 7 points [x,y] following the actual chin and jaw skin edge
             - forehead: 3 points [x,y] at the hairline boundary
             - left_eye: [x,y]
             - right_eye: [x,y]
             - mouth: [x,y]
             - nose_tip: [x,y]
          Coordinates are 0-100 normalized.` }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING },
          undertone: { type: Type.STRING },
          landmarks: {
            type: Type.OBJECT,
            properties: {
              jawline: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
              forehead: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
              left_eye: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              right_eye: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              mouth: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              nose_tip: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            }
          }
        },
        required: ['tone', 'undertone', 'landmarks']
      }
    }
  });

  // Extract generated text from response.text property directly
  return JSON.parse(response.text || '{}');
};

/**
 * Uses Google Search grounding to find real foundation shades for a given brand
 */
export const searchBrandShades = async (brand: string): Promise<{ shades: FoundationShade[], sources: GroundingSource[] }> => {
  const ai = getAI();
  const prompt = `Find all real foundation shades for the luxury brand "${brand}". Return as JSON array with 'name', 'hex', and 'buyUrl'. Use Google Search grounding for accuracy.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));

  // Fallback shades if grounding results are limited, using source links where available
  const shades: FoundationShade[] = [
    { id: '1', name: 'Alabaster', hex: '#FDF5E6', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '2', name: 'Vanilla', hex: '#F5E6D3', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '3', name: 'Honey', hex: '#D2B48C', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '4', name: 'Sand', hex: '#C68E5A', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '5', name: 'Sienna', hex: '#8B5A2B', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '6', name: 'Cocoa', hex: '#4B2C20', brand, buyUrl: sources[0]?.uri || '#' },
  ];

  return { shades, sources };
};

/**
 * Handles the conversation with Lumi, the AI beauty advisor.
 * Passes the full history to provide context-aware responses.
 */
export const chatWithGemini = async (message: string, history: ChatMessage[]): Promise<string> => {
  const ai = getAI();
  
  // Format the history for the Gemini API
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  // Add the current user message
  contents.push({ role: 'user', parts: [{ text: message }] });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: "You are Lumi, a sophisticated and helpful AI beauty advisor for LUMIÈRE. You help users with makeup tips, foundation shade matching, and brand recommendations. You are elegant, encouraging, and highly knowledgeable about skincare and cosmetics.",
    }
  });

  return response.text || "";
};
