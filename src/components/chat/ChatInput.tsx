// src/components/chat/ChatInput.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  personaType: 'text' | 'audio' | 'image' | 'speechcoach';
}

export function ChatInput({ onSubmit, isLoading, personaType }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input);
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, add newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleUploadClick = () => {
      // TODO: Implement file selection logic later
      toast.info("Media upload coming soon!");
  };

  return (
    <div className="relative">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 p-4 pt-1 bg-slate-800/50 rounded-lg border border-slate-700">
          {/* --- NEW: Upload Button (position absolute inside relative div) --- */}
          {/* Show upload button for relevant personas */}
          {(personaType === 'audio' || personaType === 'image' || personaType === 'text') && (
            <Button
              type="button" // Important: Prevent form submission
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1 text-slate-400 hover:text-slate-200 cursor-pointer" // Position top-left within padding
              onClick={handleUploadClick}
              aria-label="Upload Media"
              title="Upload Media (Coming Soon)"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
          {/* --- End NEW --- */}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message, or use + to add media..." // Updated placeholder
            // Add padding-left to make space for the button
            className="flex-1 resize-none bg-background border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-10 pr-10 pt-2 pb-2 min-h-10" // Adjusted padding & height
            rows={1}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            // Adjust position slightly if needed
            className="absolute right-1 bottom-1 cursor-pointer" // Position bottom-right within padding
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
    </div>
  );
}