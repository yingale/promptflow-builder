import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/types/workflow';
import { Workflow } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onViewBpmn: (xml: string) => void;
}

export const ChatPanel = ({
  messages,
  isLoading,
  onSendMessage,
  onViewBpmn,
}: ChatPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex h-full flex-col bg-background">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Workflow className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Create Your Workflow
              </h3>
              <p className="text-muted-foreground max-w-md">
                Describe your business process and I'll help you create a BPMN 2.0 workflow
                with Camunda support. Include details about:
              </p>
              <ul className="mt-4 text-sm text-muted-foreground space-y-1">
                <li>• Process participants and roles</li>
                <li>• Tasks and their types (user, service, external)</li>
                <li>• Decision points and conditions</li>
                <li>• Timer events and message triggers</li>
              </ul>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onViewBpmn={onViewBpmn}
              />
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <TypingIndicator />
          )}
        </div>
      </ScrollArea>

      <ChatInput
        onSend={onSendMessage}
        isLoading={isLoading}
        placeholder="Describe your workflow process..."
      />
    </div>
  );
};
