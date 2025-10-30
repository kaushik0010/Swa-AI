import type z from "zod";
import type { PersonaTypeEnum } from "./schemas";

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  type: z.infer<typeof PersonaTypeEnum>; 
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string; 
  personaId: string; 
  title: string; 
  messages: Message[];
  lastEdited: number; 
}