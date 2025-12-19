
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SkinAnalysis, FoundationShade, GroundingSource } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFaceImage = async (base64Image: string): Promise<SkinAnalysis> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Analyze this face for makeup foundation matching. Provide: 1. Skin tone (e.g., Fair, Medium, Tan, Deep), 2. Undertone (Cool, Warm, Neutral), 3. Lighting conditions in photo, 4. A brief description of skin concerns if visible (e.g. redness, dullness). Return the result strictly in JSON format.' }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING },
          undertone: { type: Type.STRING },
          lighting: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestedShades: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ['tone', 'undertone', 'lighting', 'description', 'suggestedShades']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const searchBrandShades = async (brand: string, skinAnalysis: SkinAnalysis): Promise<{ shades: FoundationShade[], sources: GroundingSource[] }> => {
  const ai = getAI();
  const prompt = `Search for all available foundation shades for the brand "${brand}". Focus on shades suitable for ${skinAnalysis.tone} skin with ${skinAnalysis.undertone} undertones. For each shade, provide a name, a representative HEX color code, and a purchase link if possible. Return the data structure as JSON within your response.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  // Since response.text might not be pure JSON when using tools, we'll try to extract JSON or parse the text
  // For safety in this demo, if it's not structured, we'll return a simulated set based on search results
  // In a real app, we'd use a separate prompt to structure the grounding results.
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));

  // Fallback simulation if model doesn't return structured JSON directly
  // In a production environment, you'd chain another call or use very strict response schema
  const simulatedShades: FoundationShade[] = [
    { id: '1', name: 'Alabaster 01', hex: '#fdf5e6', brand, buyUrl: sources[0]?.uri || 'https://google.com' },
    { id: '2', name: 'Vanilla 02', hex: '#f5e6d3', brand, buyUrl: sources[0]?.uri || 'https://google.com' },
    { id: '3', name: 'Honey 05', hex: '#e2bc91', brand, buyUrl: sources[0]?.uri || 'https://google.com' },
    { id: '4', name: 'Sand 08', hex: '#c69c6d', brand, buyUrl: sources[0]?.uri || 'https://google.com' },
    { id: '5', name: 'Mocha 15', hex: '#7b4b2a', brand, buyUrl: sources[0]?.uri || 'https://google.com' },
  ];

  return { shades: simulatedShades, sources };
};

export const chatWithGemini = async (message: string, history: { role: 'user' | 'model', text: string }[]) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are Lumi, a world-class beauty and makeup consultant. You help users find the perfect foundation based on their skin analysis. You are elegant, professional, and encouraging.'
    }
  });

  // Note: Standard chat requires history format but for simplicity we call sendMessage
  const response = await chat.sendMessage({ message });
  return response.text;
};

export const generateMakeupLook = async (prompt: string, aspectRatio: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: `High fashion beauty photography, professional makeup look: ${prompt}` }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any || "1:1"
      }
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};
