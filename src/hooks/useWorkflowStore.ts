import { useState, useCallback, useEffect } from 'react';
import { Conversation, Message, WorkflowState } from '@/types/workflow';

const STORAGE_KEY = 'bpmn-workflow-state';

const generateId = () => crypto.randomUUID();

const createNewConversation = (): Conversation => ({
  id: generateId(),
  name: 'New Workflow',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const loadState = (): WorkflowState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        conversations: parsed.conversations.map((c: Conversation) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        })),
      };
    }
  } catch (e) {
    console.error('Failed to load workflow state:', e);
  }
  
  const defaultConversation = createNewConversation();
  return {
    conversations: [defaultConversation],
    activeConversationId: defaultConversation.id,
  };
};

const saveState = (state: WorkflowState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save workflow state:', e);
  }
};

export const useWorkflowStore = () => {
  const [state, setState] = useState<WorkflowState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeConversation = state.conversations.find(
    (c) => c.id === state.activeConversationId
  );

  const setActiveConversation = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeConversationId: id }));
  }, []);

  const createConversation = useCallback(() => {
    const newConversation = createNewConversation();
    setState((prev) => ({
      conversations: [...prev.conversations, newConversation],
      activeConversationId: newConversation.id,
    }));
    return newConversation;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setState((prev) => {
      const filtered = prev.conversations.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const newConversation = createNewConversation();
        return {
          conversations: [newConversation],
          activeConversationId: newConversation.id,
        };
      }
      return {
        conversations: filtered,
        activeConversationId:
          prev.activeConversationId === id
            ? filtered[0].id
            : prev.activeConversationId,
      };
    });
  }, []);

  const renameConversation = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, name, updatedAt: new Date() } : c
      ),
    }));
  }, []);

  const addMessage = useCallback(
    (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        ...message,
        id: generateId(),
        timestamp: new Date(),
      };
      
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, newMessage],
                updatedAt: new Date(),
                name: c.messages.length === 0 && message.role === 'user' 
                  ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
                  : c.name,
              }
            : c
        ),
      }));
      
      return newMessage;
    },
    []
  );

  const updateMessage = useCallback(
    (conversationId: string, messageId: string, content: string, bpmnXml?: string) => {
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content, bpmnXml } : m
                ),
                bpmnXml: bpmnXml || c.bpmnXml,
                updatedAt: new Date(),
              }
            : c
        ),
      }));
    },
    []
  );

  const updateConversationBpmn = useCallback((id: string, bpmnXml: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, bpmnXml, updatedAt: new Date() } : c
      ),
    }));
  }, []);

  return {
    state,
    activeConversation,
    setActiveConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    addMessage,
    updateMessage,
    updateConversationBpmn,
  };
};
