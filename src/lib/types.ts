// src/lib/types.ts
export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  // This will be 'text' or 'multimodal'
  type: 'text' | 'multimodal'; 
}