// src/lib/usePersonas.ts
import type { Conversation, Message, Persona } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';

// This is our key for localStorage
const PERSONAS_STORAGE_KEY = 'swa-ai-personas';
const CONVERSATIONS_STORAGE_KEY = 'swa-ai-conversations';

export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // On load, read personas from localStorage
  useEffect(() => {
    try {
      const storedPersonas = window.localStorage.getItem(PERSONAS_STORAGE_KEY);
      if (storedPersonas) {
        setPersonas(JSON.parse(storedPersonas));
      }
      const storedConvos = window.localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (storedConvos) {
        setConversations(JSON.parse(storedConvos));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  // --- Persona Management ---
  const addPersona = useCallback((persona: Persona) => {
    setPersonas(prev => {
      const newPersonas = [...prev, persona];
      window.localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(newPersonas));
      return newPersonas;
    });
  }, []);

  const getPersona = useCallback((id: string): Persona | undefined => {
    return personas.find(p => p.id === id);
  }, [personas]);

  const personaExists = useCallback((id: string): boolean => {
     return personas.some(p => p.id === id);
  }, [personas]);

  // --- Conversation Management ---
  const getConversationsForPersona = useCallback((personaId: string): Conversation[] => {
    return conversations
      .filter(c => c.personaId === personaId)
      .sort((a, b) => b.lastEdited - a.lastEdited); // Sort newest first
  }, [conversations]);

  const getConversation = useCallback((convoId: string): Conversation | undefined => {
    return conversations.find(c => c.id === convoId);
  }, [conversations]);

  const saveConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.id === conversation.id);
      let newConversations;
      if (existingIndex > -1) {
        // Update existing conversation
        newConversations = [...prev];
        newConversations[existingIndex] = conversation;
      } else {
        // Add new conversation
        newConversations = [...prev, conversation];
      }
      window.localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(newConversations));
      return newConversations;
    });
  }, []);

  const createNewConversation = useCallback((personaId: string, firstMessage: Message): Conversation => {
     const newConversation: Conversation = {
       id: crypto.randomUUID(),
       personaId: personaId,
       title: "New Chat", // We'll update this later with AI
       messages: [firstMessage],
       lastEdited: Date.now(),
     };
     saveConversation(newConversation);
     return newConversation;
  }, [saveConversation]);

  // --- Combined Hook Return ---
  return {
    personas,
    addPersona,
    getPersona,
    personaExists, // <-- New helper
    conversations,
    getConversationsForPersona,
    getConversation,
    saveConversation,
    createNewConversation,
  };
}