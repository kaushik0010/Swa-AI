import { Bot, RotateCcw, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
  personaType: 'text' | 'audio' | 'image' | 'speechcoach';
  onRewriteClick: () => void;
}

export function ChatMessage({ message, personaType, onRewriteClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showRewriteButton = !isUser && personaType === 'text';

  return (
    <div className={cn("group flex items-start space-x-4 py-6", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="shrink-0 bg-gradient-primary rounded-full p-2.5 shadow-lg">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      <div className="flex flex-col space-y-2 max-w-[75%]">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl leading-relaxed",
            isUser
              ? "bg-gradient-primary text-primary-foreground shadow-lg"
              : "bg-card border border-border/60 text-foreground shadow-sm"
          )}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {message.content}
        </div>

        {/* Rewrite Button */}
        {showRewriteButton && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-primary/10 cursor-pointer text-xs font-medium"
              onClick={onRewriteClick}
              aria-label="Rewrite this message"
              title="Rewrite"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Rewrite
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 bg-muted rounded-full p-2.5">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}