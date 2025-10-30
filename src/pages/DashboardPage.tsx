import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePersonas } from "@/hooks/usePersonas";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import type { Persona } from "@/lib/types";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export default function DashboardPage() {
  const { personas, deletePersona } = usePersonas();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, persona: Persona) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="container max-w-7xl mx-auto px-6 py-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                My Custom Personas
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your personalized AI assistants
              </p>
            </div>
            <Button asChild className="bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all duration-200 h-12 px-8">
              <Link to="/create" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Persona
              </Link>
            </Button>
          </div>

          {/* Personas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <div key={persona.id} className="relative group">
                <Link to={`/chat/${persona.id}`}>
                  <Card className="bg-card border-border/60 hover:border-primary/40 hover:bg-gradient-subtle transition-all duration-300 group-hover:shadow-xl h-full min-h-[140px]">
                    <CardHeader className="p-6">
                      <CardTitle className="text-foreground text-xl font-semibold mb-2 line-clamp-2">
                        {persona.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground leading-relaxed line-clamp-3">
                        {persona.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                  onClick={(e) => handleDeleteClick(e, persona)}
                  aria-label={`Delete ${persona.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {personas.length === 0 && (
            <div className="text-center p-16 bg-gradient-subtle border border-border/40 rounded-2xl">
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-xl text-muted-foreground font-medium">
                  No custom personas yet
                </p>
                <p className="text-muted-foreground">
                  Create your first AI persona to get started with personalized conversations
                </p>
              </div>
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