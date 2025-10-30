export function Hero() {
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-slate-950/50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-10 max-w-4xl mx-auto px-6">
          {/* Enhanced heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Welcome to{" "}
              <span className="text-gradient-primary bg-clip-text drop-shadow-sm">
                Swa-AI
              </span>
            </h1>

            {/* Refined description */}
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Your <span className="font-semibold text-[#76c893] bg-primary/10 px-2 py-1 rounded-lg">100% private</span>, on-device AI platform.
              Your data never leaves your browser. Create custom AI personas or use our pre-built
              specialists to help you brainstorm, write, and practice your public speaking.
            </p>
          </div>

          {/* Enhanced trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 pt-8">
            {[
              { color: "bg-[#52b69a]", label: "Fully Private" },
              { color: "bg-[#34a0a4]", label: "Instant Responses" },
              { color: "bg-[#1a759f]", label: "No Subscription" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <div className={`w-3 h-3 ${item.color} rounded-full group-hover:scale-125 transition-transform duration-200`} />
                <span className="text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}