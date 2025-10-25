// src/components/chat/ChatMessage.tsx
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils"; // cn is a helper from shadcn

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex items-start space-x-3 py-4", isUser ? "justify-end" : "justify-start")}>
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
        style={{ whiteSpace: "pre-wrap" }} // This respects newlines in the AI's response
      >
        {message.content}
      </div>

      {isUser && (
        <div className="shrink-0 bg-slate-700 rounded-full p-2">
          <User className="h-5 w-5 text-slate-50" />
        </div>
      )}
    </div>
  );
}