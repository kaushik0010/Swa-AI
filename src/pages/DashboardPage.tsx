// src/pages/DashboardPage.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePersonas } from "@/hooks/usePersonas";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PREBUILT_PERSONAS } from "@/lib/prebuilt-personas";
import type { Persona } from "@/lib/types";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export default function DashboardPage() {
  const { personas, deletePersona } = usePersonas();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, persona: Persona) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Prevent card click
    setPersonaToDelete(persona);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (personaToDelete) {
      deletePersona(personaToDelete.id);
      setPersonaToDelete(null);
    }
    setIsConfirmOpen(false);
  };

  // Filter out pre-built persona placeholders if they exist in custom list
  const customPersonas = personas.filter(p => !PREBUILT_PERSONAS.some(pre => pre.id === p.id));

  return (
    <>
      <Navbar />
      <main>
        <div className="container mx-auto max-w-4xl p-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Custom Personas</h1>
            <Button asChild>
              <Link to="/create">Create New Persona</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customPersonas.map((persona) => ( // Use filtered list
              <div key={persona.id} className="relative group"> {/* Added relative container */}
                <Link to={`/chat/${persona.id}`}>
                  <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 h-full"> {/* Ensure cards are same height */}
                    <CardHeader>
                      <CardTitle className="text-slate-50">{persona.name}</CardTitle>
                      <CardDescription>{persona.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                {/* Delete Button - Positioned top-right */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
                  onClick={(e) => handleDeleteClick(e, persona)}
                  aria-label={`Delete ${persona.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {personas.length === 0 && (
            <div className="text-center p-10 bg-slate-800 rounded-lg">
              <p className="text-slate-400">You have no custom personas yet.</p>
              <p className="text-slate-400">Click "Create New" to get started</p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={`Delete Persona: ${personaToDelete?.name}?`}
        description="This will permanently delete the persona and all associated conversations. This action cannot be undone."
        confirmText="Delete Persona"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}