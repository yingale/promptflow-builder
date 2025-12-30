export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  bpmnXml?: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  bpmnXml?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowState {
  conversations: Conversation[];
  activeConversationId: string | null;
}

export interface BpmnElement {
  id: string;
  type: string;
  name?: string;
  properties?: Record<string, unknown>;
}

export interface WorkflowRequirements {
  participants?: string[];
  tasks?: Array<{
    name: string;
    type: 'user' | 'service' | 'script' | 'external';
    assignee?: string;
    formFields?: string[];
  }>;
  gateways?: Array<{
    type: 'exclusive' | 'parallel' | 'inclusive';
    conditions?: string[];
  }>;
  events?: Array<{
    type: 'timer' | 'message' | 'error' | 'signal';
    definition?: string;
  }>;
  integrations?: string[];
}
