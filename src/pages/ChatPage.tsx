// src/pages/ChatPage.tsx
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePersonas } from '@/hooks/usePersonas';
import { useMemo } from 'react';
import type { Persona } from '@/lib/types';
import { getPrebuiltPersona } from '@/lib/prebuilt-personas';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ChatPage() {
  const { personaId } = useParams();
  const { getPersona } = usePersonas();

  const persona: Persona | undefined = useMemo(() => {
    if (!personaId) return undefined;
    
    // 1. Try to find a pre-built persona first
    const prebuilt = getPrebuiltPersona(personaId);
    if (prebuilt) {
      return prebuilt;
    }
    
    // 2. If not pre-built, check custom personas in localStorage
    return getPersona(personaId);

  }, [personaId, getPersona]);

  if (!persona) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto max-w-2xl p-4 text-center py-8">
          <h1 className="text-2xl font-bold text-red-400">Persona not found</h1>
          <Button variant="link" asChild>
            <Link to="/">Go back to Home</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-2xl p-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Chat with {persona.name}
        </h1>

        {/* We will build this tomorrow! */}
        <div className="text-center p-10 bg-slate-800 rounded-lg">
          <p className="text-slate-400">Chat UI coming on Day 3!</p>
          <p className="text-slate-500 text-sm mt-4">Type: {persona.type}</p>
          <p className="text-slate-500 text-sm mt-2">Prompt: {persona.systemPrompt}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}