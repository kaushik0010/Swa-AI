import { Link, useLocation } from "react-router-dom";
import { Bot, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Navbar() {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between">
        {/* Clean Logo */}
        <Link 
          to="/" 
          className="flex items-center space-x-3 group"
        >
          <Bot className="h-8 w-8 text-primary transition-colors group-hover:text-[#76c893]" />
          <span className="font-bold text-2xl text-gradient-primary">
            Swa-AI
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center space-x-3 md:flex">
          <Button 
            asChild 
            variant={location.pathname === "/dashboard" ? "default" : "outline"}
            className={cn(
              "font-semibold transition-all duration-200",
              location.pathname === "/dashboard" 
                ? "bg-gradient-primary text-primary-foreground" 
                : "border-primary/30 text-primary hover:bg-primary/10"
            )}
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              My Custom Personas
            </Link>
          </Button>
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[340px]">
              <div className="flex flex-col space-y-4 pt-8">
                <SheetClose asChild>
                  <Link 
                    to="/dashboard" 
                    className={cn(
                      "text-lg font-semibold py-3 px-4 rounded-lg transition-all flex items-center gap-3",
                      location.pathname === "/dashboard" 
                        ? "bg-gradient-primary text-primary-foreground" 
                        : "text-primary hover:bg-primary/10 border border-primary/20"
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                    My Custom Personas
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link 
                    to="/create" 
                    className="text-lg font-semibold py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-[#76c893] transition-all flex items-center gap-3"
                  >
                    <span>+</span>
                    <span>Create New Persona</span>
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}