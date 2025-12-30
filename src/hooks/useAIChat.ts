import { useState, useCallback } from 'react';
import { Message } from '@/types/workflow';
import { toast } from 'sonner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bpmn-chat`;

interface UseAIChatOptions {
  onMessageStart: () => Message;
  onMessageUpdate: (messageId: string, content: string, bpmnXml?: string) => void;
  onMessageComplete: () => void;
  conversationHistory: Message[];
}

export const useAIChat = ({
  onMessageStart,
  onMessageUpdate,
  onMessageComplete,
  conversationHistory,
}: UseAIChatOptions) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (isLoading) return;

      setIsLoading(true);

      try {
        const assistantMessage = onMessageStart();

        const messagesForApi = conversationHistory
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        messagesForApi.push({ role: 'user', content: userMessage });

        const resp = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesForApi }),
        });

        if (!resp.ok) {
          if (resp.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (resp.status === 402) {
            throw new Error('AI credits exhausted. Please add more credits.');
          }
          throw new Error('Failed to get AI response');
        }

        if (!resp.body) throw new Error('No response body');

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let fullContent = '';
        let bpmnXml: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                
                // Extract BPMN XML if present
                const bpmnMatch = fullContent.match(/```xml\n([\s\S]*?)```/);
                if (bpmnMatch) {
                  bpmnXml = bpmnMatch[1].trim();
                }
                
                onMessageUpdate(assistantMessage.id, fullContent, bpmnXml);
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        onMessageComplete();
      } catch (error) {
        console.error('Chat error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to send message');
        onMessageComplete();
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationHistory, onMessageStart, onMessageUpdate, onMessageComplete]
  );

  return { sendMessage, isLoading };
};
