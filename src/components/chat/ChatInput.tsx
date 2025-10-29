// src/components/chat/ChatInput.tsx
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
    // Submit on Enter, add newline on Shift+Enter
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
      // Basic validation (optional: add size limit)
      if (personaType === 'image' && !file.type.startsWith('image/')) {
        toast.error("Please select an image file.");
        return;
      }
      if (personaType === 'audio' && !file.type.startsWith('audio/')) {
        toast.error("Please select an audio file.");
        return;
      }
      // For 'text' persona, allow both (or refine later)
      if (personaType === 'text' && !(file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
           toast.error("Please select an image or audio file.");
           return;
      }

      console.log("File selected:", file.name, file.type);
      onFileSelect(file); // Pass file up to parent
    }
    // Reset file input value so onChange fires again for the same file
    if (event.target) {
        event.target.value = '';
    }
  };

  // --- Handle removing attached file ---
  const handleRemoveFile = () => {
      onFileSelect(null); // Clear file in parent state
  };


  // Define accepted file types based on persona
  const acceptTypes = personaType === 'image' ? 'image/*' :
                      personaType === 'audio' ? 'audio/*' :
                      'image/*,audio/*';

  return (
    <div className="relative">
      {/* --- Display Attached File --- */}
      {attachedFile && (
        <div className="absolute bottom-full left-0 right-0 mb-1 px-4">
          <div className="flex items-center justify-between p-2 bg-slate-700 rounded text-sm text-slate-200">
            <div className="flex items-center space-x-2 truncate">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span className="truncate" title={attachedFile.name}>{attachedFile.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100"
              onClick={handleRemoveFile}
              aria-label="Remove attached file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {/* --- End Attached File Display --- */}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2 p-4 pt-1 bg-slate-800/50 rounded-lg border border-slate-700">
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
              className="absolute left-1 top-1 text-slate-400 hover:text-slate-200"
              onClick={handleUploadClick}
              aria-label="Upload Media"
              title={`Upload ${acceptTypes.replace('/*', '')}`} // Dynamic title
          >
              <Plus className="h-5 w-5" />
          </Button>
        )}

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachedFile ? "Add a message (optional)..." : "Type your message, or use + to add media..."}
          className={cn(
            "flex-1 resize-none bg-background border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-10 pr-10 pt-2 pb-2 min-h-10",
             // Dim text area slightly when file is attached and input is empty
             attachedFile && !input.trim() ? "placeholder-slate-500" : ""
          )}
          rows={1}
        />
        <Button
          type="submit"
          // Enable send if loading is false AND (text exists OR file attached)
          disabled={isLoading || (!input.trim() && !attachedFile)}
          size="icon"
          className="absolute right-1 bottom-1"
          >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}