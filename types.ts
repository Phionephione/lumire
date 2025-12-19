
export interface SkinAnalysis {
  tone: string;
  undertone: string;
  lighting: string;
  suggestedShades: string[];
  description: string;
  faceBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  landmarks: {
    forehead_center: [number, number];
    left_temple: [number, number];
    right_temple: [number, number];
    left_jaw: [number, number];
    right_jaw: [number, number];
    chin_tip: [number, number];
    left_eye: [number, number];
    right_eye: [number, number];
    nose_bridge: [number, number];
    mouth_center: [number, number];
  };
}

export interface FoundationShade {
  id: string;
  name: string;
  hex: string;
  brand: string;
  buyUrl: string;
  price?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AppStep = 'welcome' | 'capture' | 'analyze' | 'brand-select' | 'shade-select' | 'try-on';

export interface GroundingSource {
  title: string;
  uri: string;
}
