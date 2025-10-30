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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        {/* Enhanced Logo */}
        <Link
          to="/"
          className="flex items-center space-x-3 group transition-transform hover:scale-105 duration-200"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-200" />
            <Bot className="h-8 w-8 text-primary relative z-10 transition-colors group-hover:text-[#76c893]" />
          </div>
          <span className="font-bold text-2xl text-gradient-primary tracking-tight">
            Swa-AI
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center space-x-4 md:flex">
          <Button
            asChild
            className={cn(
              "font-semibold transition-all duration-200 h-11 px-6",
              location.pathname === "/dashboard"
                ? "bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
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
                className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 h-10 w-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[340px] glass border-l border-border/40">
              <div className="flex flex-col space-y-3 pt-8">
                <SheetClose asChild>
                  <Link
                    to="/dashboard"
                    className={cn(
                      "text-lg font-semibold py-3 px-4 rounded-xl transition-all flex items-center gap-3 group",
                      location.pathname === "/dashboard"
                        ? "bg-gradient-primary text-primary-foreground shadow-lg"
                        : "text-primary hover:bg-primary/10 border border-primary/10 glass"
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                    My Custom Personas
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/create"
                    className="text-lg font-semibold py-3 px-4 rounded-xl bg-gradient-primary text-primary-foreground hover:shadow-lg transition-all flex items-center gap-3 group shadow-lg"
                  >
                    <span className="group-hover:scale-110 transition-transform">+</span>
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