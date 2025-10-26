// src/components/chat/ConversationList.tsx
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
  const { deleteConversation, deleteAllConversationsForPersona } = usePersonas(); // Get delete functions

  // State for single convo delete confirmation
  const [isConfirmSingleOpen, setIsConfirmSingleOpen] = useState(false);
  const [convoToDelete, setConvoToDelete] = useState<Conversation | null>(null);

  // State for delete all confirmation
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
     // Optional: navigate to base chat page after deleting all
     // navigate(`/chat/${persona.id}`);
  };

  if (conversations.length === 0) {
    return null; // Don't show anything if no past chats
  }

  return (
    <div className="mb-6 border border-slate-700 rounded-lg p-3 bg-slate-800/30">
      <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Past Conversations</h2>
          {/* Delete All Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-red-500 px-2"
            onClick={handleDeleteAllClick}
            aria-label={`Delete all conversations for ${persona.name}`}
            title="Delete all conversations"
          >
             <MessageSquareWarning className="h-4 w-4 mr-1" /> Delete All
          </Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {conversations.map(convo => (
          <div key={convo.id} className="relative group flex items-center">
            <Link to={`/chat/${persona.id}?convo=${convo.id}`} className="grow">
              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-slate-100 truncate">{convo.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Last edited: {new Date(convo.lastEdited).toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            {/* Delete Button per conversation */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => handleDeleteClick(e, convo)}
              aria-label={`Delete conversation: ${convo.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

       {/* Confirmation Dialogs */}
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