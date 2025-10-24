import { Bot, Github, Linkedin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-slate-900/50 backdrop-blur-sm">
      <div className="container max-w-4xl py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Enhanced Logo & Copyright */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Swa-AI</span>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              © 2025 All Rights Reserved
            </span>
          </div>

          {/* Made with love */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
            <span>for privacy-focused AI</span>
          </div>

          {/* Enhanced Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        {/* Mobile copyright */}
        <div className="mt-4 text-center md:hidden">
          <span className="text-sm text-muted-foreground">
            © 2025 Swa-AI. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}