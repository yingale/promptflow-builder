import { Message } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { User, Bot, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: Message;
  onViewBpmn?: (xml: string) => void;
}

export const ChatMessage = ({ message, onViewBpmn }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  // Extract text content without BPMN XML code block
  const displayContent = message.content.replace(/```xml\n[\s\S]*?```/g, '').trim();
  const hasBpmn = message.bpmnXml && message.bpmnXml.includes('<?xml');

  return (
    <div
      className={cn(
        'flex gap-3 animate-message-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {displayContent || (hasBpmn ? 'I\'ve generated a BPMN workflow for you:' : '')}
        </div>

        {hasBpmn && (
          <Button
            size="sm"
            variant={isUser ? 'secondary' : 'outline'}
            className="self-start gap-2"
            onClick={() => onViewBpmn?.(message.bpmnXml!)}
          >
            <FileCode className="h-4 w-4" />
            View BPMN Diagram
          </Button>
        )}
      </div>
    </div>
  );
};
