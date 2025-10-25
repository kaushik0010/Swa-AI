// src/components/chat/ConversationList.tsx
import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Conversation } from '@/lib/types';

interface ConversationListProps {
  conversations: Conversation[];
  personaId: string;
}

export function ConversationList({ conversations, personaId }: ConversationListProps) {
  if (conversations.length === 0) {
    return null; // Don't show anything if no past chats
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Past Conversations</h2>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2"> {/* Limit height */}
        {conversations.map(convo => (
          <Link key={convo.id} to={`/chat/${personaId}?convo=${convo.id}`}>
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-slate-100 truncate">{convo.title}</CardTitle>
                <CardDescription className="text-xs">
                  Last edited: {new Date(convo.lastEdited).toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}