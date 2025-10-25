// src/lib/types.ts
export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  // This will be 'text' or 'multimodal'
  type: 'text' | 'multimodal'; 
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Add timestamp for ordering
}

export interface Conversation {
  id: string; // Unique ID for this specific chat session
  personaId: string; // Which persona this chat is with
  title: string; // Title (e.g., "Dragon Coding Story")
  messages: Message[];
  lastEdited: number; // Timestamp for sorting later
}