// src/pages/DashboardPage.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePersonas } from "@/hooks/usePersonas";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardPage() {
  const { personas } = usePersonas();

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
            {/* ... (map logic is the same) ... */}
            {personas.map((persona) => (
              <Link to={`/chat/${persona.id}`} key={persona.id}>
                <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-50">{persona.name}</CardTitle>
                    <CardDescription>{persona.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
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
    </>
  );
}