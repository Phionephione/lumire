
export interface SkinAnalysis {
  tone: string;
  undertone: string;
  lighting: string;
  suggestedShades: string[];
  description: string;
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
