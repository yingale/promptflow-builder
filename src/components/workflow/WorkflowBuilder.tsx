import { useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatPanel } from './ChatPanel';
import { BpmnViewer } from './BpmnViewer';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useAIChat } from '@/hooks/useAIChat';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const WorkflowBuilder = () => {
  const {
    state,
    activeConversation,
    setActiveConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    addMessage,
    updateMessage,
    updateConversationBpmn,
  } = useWorkflowStore();

  const [activeBpmnXml, setActiveBpmnXml] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMessageStart = useCallback(() => {
    if (!activeConversation) return { id: '', role: 'assistant' as const, content: '', timestamp: new Date() };
    return addMessage(activeConversation.id, { role: 'assistant', content: '' });
  }, [activeConversation, addMessage]);

  const handleMessageUpdate = useCallback(
    (messageId: string, content: string, bpmnXml?: string) => {
      if (!activeConversation) return;
      updateMessage(activeConversation.id, messageId, content, bpmnXml);
      if (bpmnXml) {
        setActiveBpmnXml(bpmnXml);
      }
    },
    [activeConversation, updateMessage]
  );

  const handleMessageComplete = useCallback(() => {
    // Any cleanup after message is complete
  }, []);

  const { sendMessage, isLoading } = useAIChat({
    onMessageStart: handleMessageStart,
    onMessageUpdate: handleMessageUpdate,
    onMessageComplete: handleMessageComplete,
    conversationHistory: activeConversation?.messages || [],
  });

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeConversation) return;
      addMessage(activeConversation.id, { role: 'user', content });
      sendMessage(content);
    },
    [activeConversation, addMessage, sendMessage]
  );

  const handleViewBpmn = useCallback((xml: string) => {
    setActiveBpmnXml(xml);
  }, []);

  const handleBpmnChange = useCallback(
    (xml: string) => {
      if (activeConversation) {
        updateConversationBpmn(activeConversation.id, xml);
      }
    },
    [activeConversation, updateConversationBpmn]
  );

  // Get latest BPMN from active conversation if not explicitly set
  const displayBpmnXml = activeBpmnXml || activeConversation?.bpmnXml;

  const SidebarContent = (
    <ConversationSidebar
      conversations={state.conversations}
      activeId={state.activeConversationId}
      onSelect={(id) => {
        setActiveConversation(id);
        const conversation = state.conversations.find((c) => c.id === id);
        setActiveBpmnXml(conversation?.bpmnXml || null);
        setSidebarOpen(false);
      }}
      onCreate={() => {
        createConversation();
        setActiveBpmnXml(null);
        setSidebarOpen(false);
      }}
      onDelete={deleteConversation}
      onRename={renameConversation}
    />
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            {SidebarContent}
          </SheetContent>
        </Sheet>
        <h1 className="font-semibold">BPMN Workflow Builder</h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Desktop Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
            {SidebarContent}
          </ResizablePanel>

          <ResizableHandle className="hidden md:block" />

          {/* Chat Panel */}
          <ResizablePanel defaultSize={displayBpmnXml ? 40 : 80} minSize={30}>
            <ChatPanel
              messages={activeConversation?.messages || []}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onViewBpmn={handleViewBpmn}
            />
          </ResizablePanel>

          {displayBpmnXml && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={30}>
                <BpmnViewer
                  xml={displayBpmnXml}
                  onXmlChange={handleBpmnChange}
                  className="h-full"
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
