// src/lib/usePersonas.ts
import type { Persona } from '@/lib/types';
import { useState, useEffect } from 'react';

// This is our key for localStorage
const STORAGE_KEY = 'swa-ai-personas';

export function usePersonas() {
  // This state will hold our array of personas
  const [personas, setPersonas] = useState<Persona[]>([]);

  // On load, read personas from localStorage
  useEffect(() => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setPersonas(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to parse personas from localStorage", error);
    }
  }, []);

  // Function to add a new persona
  const addPersona = (persona: Persona) => {
    const newPersonas = [...personas, persona];
    setPersonas(newPersonas);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newPersonas));
  };

  // Function to get a single persona by its ID
  const getPersona = (id: string) => {
    return personas.find(p => p.id === id);
  };

  return { personas, addPersona, getPersona };
}