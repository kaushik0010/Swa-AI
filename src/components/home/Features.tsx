import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, BrainCircuit, Zap, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Lock className="h-12 w-12 text-[#52b69a]" />,
    title: "100% Private & Secure",
    description: "All AI processing happens locally on your device. Your conversations and data never leave your machine.",
  },
  {
    icon: <BrainCircuit className="h-12 w-12 text-[#34a0a4]" />,
    title: "Smart Personas",
    description: "Create specialized AI assistants that understand your context and remember your preferences.",
  },
  {
    icon: <Zap className="h-12 w-12 text-[#76c893]" />,
    title: "Lightning Fast",
    description: "Experience instant responses without internet dependency. Offline-capable AI with zero latency.",
  },
];

export function Features() {
  return (
    <section className="py-24 md:py-32 bg-linear-to-b from-background to-slate-950/30">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Why Choose Swa-AI</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 leading-tight">
            Built for <span className="text-[#52b69a]">Privacy</span> and{" "}
            <span className="text-[#34a0a4]">Performance</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience private AI conversations without compromising on speed or security. Enterprise-grade privacy meets consumer-friendly design.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-card border-border/60 hover:border-primary/30 hover:bg-gradient-subtle transition-all duration-300 group hover:shadow-xl"
            >
              <CardHeader className="p-10 text-center">
                <div className="mb-8 flex justify-center">
                  <div className="p-4 rounded-2xl bg-primary/5 group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-6 leading-tight">
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