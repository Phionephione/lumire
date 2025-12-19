
export interface FacialLandmarks {
  jawline: [number, number][]; // Array of 5-7 points defining the jaw and chin
  forehead: [number, number][]; // 3 points for the hairline/forehead boundary
  left_eye: [number, number];
  right_eye: [number, number];
  mouth: [number, number];
  nose_tip: [number, number];
}

export interface SkinAnalysis {
  tone: string;
  undertone: string;
  description: string;
  landmarks: FacialLandmarks;
}

export interface FoundationShade {
  id: string;
  name: string;
  hex: string;
  brand: string;
  buyUrl: string;
}

export type AppStep = 'welcome' | 'brand-discovery' | 'live-mirror';

export interface GroundingSource {
  title: string;
  uri: string;
}

/**
 * Added ChatMessage interface to support the beauty advisor chat functionality
 */
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
