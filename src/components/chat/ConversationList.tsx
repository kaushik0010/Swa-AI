import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Conversation, Persona } from '@/lib/types';
import { usePersonas } from '@/hooks/usePersonas';
import { useState } from 'react';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Button } from '../ui/button';
import { MessageSquareWarning, Trash2 } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  persona: Persona;
}

export function ConversationList({ conversations, persona }: ConversationListProps) {
  const { deleteConversation, deleteAllConversationsForPersona } = usePersonas();

  const [isConfirmSingleOpen, setIsConfirmSingleOpen] = useState(false);
  const [convoToDelete, setConvoToDelete] = useState<Conversation | null>(null);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, convo: Conversation) => {
    e.preventDefault();
    e.stopPropagation();
    setConvoToDelete(convo);
    setIsConfirmSingleOpen(true);
  };

  const handleConfirmSingleDelete = () => {
    if (convoToDelete) {
      deleteConversation(convoToDelete.id);
      setConvoToDelete(null);
    }
    setIsConfirmSingleOpen(false);
  };

  const handleDeleteAllClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmAllOpen(true);
  };

  const handleConfirmAllDelete = () => {
     deleteAllConversationsForPersona(persona.id);
     setIsConfirmAllOpen(false);
  };

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 border border-border/40 rounded-xl p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Past Conversations</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors px-3 py-2 h-auto cursor-pointer"
            onClick={handleDeleteAllClick}
            aria-label={`Delete all conversations for ${persona.name}`}
            title="Delete all conversations"
          >
             <MessageSquareWarning className="h-4 w-4 mr-2" /> 
             <span className="text-sm font-medium">Delete All</span>
          </Button>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {conversations.map(convo => (
          <div key={convo.id} className="relative group flex items-center">
            <Link to={`/chat/${persona.id}?convo=${convo.id}`} className="grow">
              <Card className="bg-card/60 border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group-hover:shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base font-semibold text-foreground truncate">
                    {convo.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Last edited: {new Date(convo.lastEdited).toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 shrink-0 cursor-pointer"
              onClick={(e) => handleDeleteClick(e, convo)}
              aria-label={`Delete conversation: ${convo.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        open={isConfirmSingleOpen}
        onOpenChange={setIsConfirmSingleOpen}
        title={`Delete Chat: ${convoToDelete?.title}?`}
        description="This will permanently delete this conversation. This action cannot be undone."
        confirmText="Delete Chat"
        onConfirm={handleConfirmSingleDelete}
      />
      <ConfirmationDialog
        open={isConfirmAllOpen}
        onOpenChange={setIsConfirmAllOpen}
        title={`Delete ALL Chats for ${persona.name}?`}
        description={`This will permanently delete all ${conversations.length} conversations associated with this persona. This action cannot be undone.`}
        confirmText="Delete All Chats"
        onConfirm={handleConfirmAllDelete}
      />
    </div>
  );
}