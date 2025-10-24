export function Hero() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Clean heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="text-gradient-primary">
              Swa-AI
            </span>
          </h1>
          
          {/* Clear description */}
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Your <span className="font-semibold text-[#76c893]">100% private</span>, on-device AI platform. 
            Your data never leaves your browser. Create custom AI personas or use our pre-built 
            specialists to help you brainstorm, write, and practice your public speaking.
          </p>

          {/* Simple trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-8 text-base text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#52b69a] rounded-full" />
              <span>Fully Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#34a0a4] rounded-full" />
              <span>Instant Responses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#1a759f] rounded-full" />
              <span>No Subscription</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}