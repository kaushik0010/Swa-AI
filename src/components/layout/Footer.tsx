import { Bot, Github, Linkedin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background/80 backdrop-blur-lg">
      <div className="container max-w-7xl mx-auto py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Enhanced Logo & Copyright */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Bot className="h-7 w-7 text-primary" />
              <span className="font-semibold text-xl text-foreground">Swa-AI</span>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline border-l border-border/40 pl-4">
              © 2025 All Rights Reserved
            </span>
          </div>

          {/* Made with love */}
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>for privacy-focused AI</span>
          </div>

          {/* Enhanced Social Links */}
          <div className="flex items-center space-x-5">
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
        <div className="mt-6 text-center md:hidden border-t border-border/30 pt-6">
          <span className="text-sm text-muted-foreground">
            © 2025 Swa-AI. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}