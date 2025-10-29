// src/components/chat/ChatMessage.tsx
import { Bot, RotateCcw, User } from "lucide-react";
import { cn } from "@/lib/utils"; // cn is a helper from shadcn
import { Button } from "../ui/button";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
  personaType: 'text' | 'audio' | 'image' | 'speechcoach'; // Add personaType
  onRewriteClick: () => void;
}

export function ChatMessage({ message, personaType, onRewriteClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showRewriteButton = !isUser && personaType === 'text';

  return (
    <div className={cn("group flex items-start space-x-3 py-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="shrink-0 bg-primary rounded-full p-2">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "p-3 rounded-lg max-w-[80%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-slate-800 text-slate-50"
        )}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {message.content}
      </div>

      {isUser && (
         <div className="shrink-0 bg-slate-700 rounded-full p-2">
           <User className="h-5 w-5 text-slate-50" />
         </div>
      )}

      {/* Rewrite Button - appears on hover for assistant text messages */}
      {showRewriteButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200 cursor-pointer" // Show on hover
          onClick={onRewriteClick}
          aria-label="Rewrite this message"
          title="Rewrite"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}