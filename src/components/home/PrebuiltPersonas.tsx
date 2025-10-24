import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ArrowRight } from "lucide-react";
import { PREBUILT_PERSONAS } from "@/lib/prebuilt-personas";

export function PrebuiltPersonas() {
  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Try a Pre-built Persona
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Jump right in with our expertly crafted AI specialists
            </p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Persona
            </Link>
          </Button>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PREBUILT_PERSONAS.map((persona) => (
            <Link 
              to={`/chat/${persona.id}`} 
              key={persona.id}
              className="block group"
            >
              <Card className="bg-card border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                <CardHeader className="h-full flex flex-col">
                  <CardTitle className="text-foreground flex items-center justify-between">
                    {persona.name}
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200 opacity-0 group-hover:opacity-100 text-primary" />
                  </CardTitle>
                  <CardDescription className="grow mt-2">
                    {persona.description}
                  </CardDescription>
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-primary font-medium">
                      Start chatting →
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center md:hidden">
          <Button asChild variant="outline" className="w-full max-w-sm">
            <Link to="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Persona
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}