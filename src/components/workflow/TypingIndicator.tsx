import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex gap-3 animate-message-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
};
