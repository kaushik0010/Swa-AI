import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ArrowRight } from "lucide-react";
import { PREBUILT_PERSONAS } from "@/lib/prebuilt-personas";

export function PrebuiltPersonas() {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-7xl mx-auto px-6">
        {/* Enhanced Section Header */}
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center mb-16">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-semibold text-primary">Get Started</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Try a Pre-built Persona
            </h2>
            <p className="text-xl text-muted-foreground">
              Jump right in with our expertly crafted AI specialists. Perfect for immediate productivity.
            </p>
          </div>
          <Button asChild className="hidden md:flex bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all duration-200 h-12 px-8">
            <Link to="/create">
              <Plus className="mr-2 h-5 w-5" />
              Create New Persona
            </Link>
          </Button>
        </div>

        {/* Enhanced Persona Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PREBUILT_PERSONAS.map((persona) => (
            <Link
              to={`/chat/${persona.id}`}
              key={persona.id}
              className="block group"
            >
              <Card className="bg-card border-border/60 hover:border-primary/40 hover:bg-gradient-subtle transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 h-full">
                <CardHeader className="h-full flex flex-col p-8">
                  <CardTitle className="text-foreground flex items-center justify-between text-xl font-bold">
                    {persona.name}
                    <ArrowRight className="h-5 w-5 transform group-hover:translate-x-2 transition-transform duration-200 opacity-0 group-hover:opacity-100 text-primary" />
                  </CardTitle>
                  <CardDescription className="grow mt-4 text-base leading-relaxed">
                    {persona.description}
                  </CardDescription>
                  <div className="mt-6 pt-6 border-t border-border/40">
                    <span className="text-sm font-semibold text-primary group-hover:underline transition-all">
                      Start chatting →
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Enhanced Mobile CTA */}
        <div className="mt-12 flex justify-center md:hidden">
          <Button asChild className="w-full max-w-sm bg-gradient-primary h-12 text-base">
            <Link to="/create">
              <Plus className="mr-2 h-5 w-5" />
              Create New Persona
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}