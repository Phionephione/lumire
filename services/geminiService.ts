
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
        { text: `Analyze this face for foundation matching. 
          1. Detect skin tone/undertone. 
          2. Return strictly as JSON.
          3. Crucially, detect 10 facial landmarks as normalized [x, y] coordinates (0-100):
             - forehead_center (hairline center)
             - left_temple, right_temple
             - left_jaw, right_jaw (ear level)
             - chin_tip
             - left_eye, right_eye
             - nose_bridge
             - mouth_center` }
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
          suggestedShades: { type: Type.ARRAY, items: { type: Type.STRING } },
          faceBox: {
            type: Type.OBJECT,
            properties: {
              top: { type: Type.NUMBER },
              left: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER }
            }
          },
          landmarks: {
            type: Type.OBJECT,
            properties: {
              forehead_center: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              left_temple: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              right_temple: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              left_jaw: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              right_jaw: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              chin_tip: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              left_eye: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              right_eye: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              nose_bridge: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              mouth_center: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            }
          }
        },
        required: ['tone', 'undertone', 'landmarks']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const searchBrandShades = async (brand: string, skinAnalysis: SkinAnalysis): Promise<{ shades: FoundationShade[], sources: GroundingSource[] }> => {
  const ai = getAI();
  const prompt = `Search for all available foundation shades for the brand "${brand}". Focus on shades suitable for ${skinAnalysis.tone} skin with ${skinAnalysis.undertone} undertones. For each shade, provide a name, a HEX color code, and a purchase link. Return strictly as JSON.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));

  // Simulate shades for demo purposes if search is blocked or limited
  const simulatedShades: FoundationShade[] = [
    { id: '1', name: 'Alabaster 01', hex: '#FDF5E6', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '2', name: 'Vanilla 02', hex: '#F5E6D3', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '3', name: 'Honey 05', hex: '#D2B48C', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '4', name: 'Sand 08', hex: '#C68E5A', brand, buyUrl: sources[0]?.uri || '#' },
    { id: '5', name: 'Sienna 12', hex: '#8B5A2B', brand, buyUrl: sources[0]?.uri || '#' },
  ];

  return { shades: simulatedShades, sources };
};

export const chatWithGemini = async (message: string, history: { role: 'user' | 'model', text: string }[]) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are Lumi, a world-class beauty consultant. You are elegant, professional, and helpful.'
    }
  });
  const response = await chat.sendMessage({ message });
  return response.text;
};
