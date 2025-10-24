import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, BrainCircuit, Zap, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Lock className="h-10 w-10 text-[#52b69a]" />,
    title: "100% Private & Secure",
    description: "All AI processing happens locally on your device. Your conversations and data never leave your machine.",
  },
  {
    icon: <BrainCircuit className="h-10 w-10 text-[#34a0a4]" />,
    title: "Smart Personas",
    description: "Create specialized AI assistants that understand your context and remember your preferences.",
  },
  {
    icon: <Zap className="h-10 w-10 text-[#76c893]" />,
    title: "Lightning Fast",
    description: "Experience instant responses without internet dependency. Offline-capable AI with zero latency.",
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-28 bg-muted/20">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Why Choose Swa-AI</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Built for <span className="text-[#52b69a]">Privacy</span> and{" "}
            <span className="text-[#34a0a4]">Performance</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience private AI conversations without compromising on speed or security
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="bg-card border-border hover:border-primary/30 transition-colors duration-200"
            >
              <CardHeader className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-4">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed text-lg">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}