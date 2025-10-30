import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Plus, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit: (message: string, file?: File) => void;
  isLoading: boolean;
  personaType: 'text' | 'audio' | 'image' | 'speechcoach';
  attachedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export function ChatInput({ 
  onSubmit, 
  isLoading, 
  personaType, 
  attachedFile, 
  onFileSelect 
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && (input.trim() || attachedFile)) {
      onSubmit(input, attachedFile || undefined);
      setInput('');
      onFileSelect(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && (input.trim() || attachedFile)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (personaType === 'image' && !file.type.startsWith('image/')) {
        toast.error("Please select an image file.");
        return;
      }
      if (personaType === 'audio' && !file.type.startsWith('audio/')) {
        toast.error("Please select an audio file.");
        return;
      }
      if (personaType === 'text' && !(file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
           toast.error("Please select an image or audio file.");
           return;
      }

      console.log("File selected:", file.name, file.type);
      onFileSelect(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleRemoveFile = () => {
      onFileSelect(null);
  };

  const acceptTypes = personaType === 'image' ? 'image/*' :
                      personaType === 'audio' ? 'audio/*' :
                      'image/*,audio/*';

  return (
    <div className="relative">
      {/* Attached File Display */}
      {attachedFile && (
        <div className="absolute bottom-full left-0 right-0 mb-3 px-4">
          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-foreground backdrop-blur-sm">
            <div className="flex items-center space-x-2 truncate">
              <Paperclip className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium" title={attachedFile.name}>{attachedFile.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleRemoveFile}
              aria-label="Remove attached file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2 p-4 pt-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/60">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptTypes}
          style={{ display: 'none' }}
        />

        {/* Upload Button */}
        {(personaType === 'audio' || personaType === 'image' || personaType === 'text') && (
          <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-2 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200 h-8 w-8"
              onClick={handleUploadClick}
              aria-label="Upload Media"
              title={`Upload ${acceptTypes.replace('/*', '')}`}
          >
              <Plus className="h-4 w-4" />
          </Button>
        )}

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachedFile ? "Add a message (optional)..." : "Type your message, or use + to add media..."}
          className={cn(
            "flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-10 pr-10 pt-3 pb-3 min-h-12 text-base",
            attachedFile && !input.trim() ? "placeholder-muted-foreground/60" : ""
          )}
          rows={1}
        />
        <Button
          type="submit"
          disabled={isLoading || (!input.trim() && !attachedFile)}
          size="icon"
          className="absolute right-2 bottom-2 bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all duration-200 h-8 w-8"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}