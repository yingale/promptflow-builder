import { useEffect, useRef, useState } from 'react';
import { Download, ZoomIn, ZoomOut, Maximize2, Edit3, Eye, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BpmnViewerProps {
  xml: string;
  onXmlChange?: (xml: string) => void;
  className?: string;
}

export const BpmnViewer = ({ xml, onXmlChange, className }: BpmnViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode
  const [isLoading, setIsLoading] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const loadBpmn = async () => {
      if (!containerRef.current || !xml) return;

      try {
        setIsLoading(true);
        
        // Dynamically import bpmn-js Modeler
        const BpmnJS = (await import('bpmn-js/lib/Modeler')).default;
        
        // Clean up previous instance
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        // Create new modeler with full editing capabilities
        viewerRef.current = new BpmnJS({
          container: containerRef.current,
          keyboard: { bindTo: document },
        });

        await viewerRef.current.importXML(xml);
        
        // Fit to viewport
        const canvas = viewerRef.current.get('canvas');
        canvas.zoom('fit-viewport');

        // Setup command stack listener for undo/redo state
        const commandStack = viewerRef.current.get('commandStack');
        commandStack.on('changed', () => {
          setCanUndo(commandStack.canUndo());
          setCanRedo(commandStack.canRedo());
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load BPMN:', error);
        toast.error('Failed to render BPMN diagram');
        setIsLoading(false);
      }
    };

    loadBpmn();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [xml]);

  // Update container class when edit mode changes
  useEffect(() => {
    if (containerRef.current) {
      if (isEditing) {
        containerRef.current.classList.remove('view-mode');
      } else {
        containerRef.current.classList.add('view-mode');
      }
    }
  }, [isEditing]);

  const handleZoomIn = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      canvas.zoom(canvas.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      canvas.zoom(canvas.zoom() / 1.2);
    }
  };

  const handleFitViewport = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      canvas.zoom('fit-viewport');
    }
  };

  const handleUndo = () => {
    if (viewerRef.current) {
      const commandStack = viewerRef.current.get('commandStack');
      commandStack.undo();
    }
  };

  const handleRedo = () => {
    if (viewerRef.current) {
      const commandStack = viewerRef.current.get('commandStack');
      commandStack.redo();
    }
  };

  const handleDownload = async () => {
    if (!viewerRef.current) return;
    
    try {
      const { xml: exportedXml } = await viewerRef.current.saveXML({ format: true });
      const blob = new Blob([exportedXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workflow.bpmn';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('BPMN file downloaded');
    } catch (error) {
      console.error('Failed to export BPMN:', error);
      toast.error('Failed to export BPMN file');
    }
  };

  const handleSaveChanges = async () => {
    if (!viewerRef.current || !onXmlChange) return;
    
    try {
      const { xml: updatedXml } = await viewerRef.current.saveXML({ format: true });
      onXmlChange(updatedXml);
      toast.success('Changes saved');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (!xml) {
    return (
      <div className={cn('flex items-center justify-center bg-muted/50', className)}>
        <p className="text-muted-foreground">No BPMN diagram to display</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-card', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleFitViewport} title="Fit to Screen">
            <Maximize2 className="h-4 w-4" />
          </Button>
          {isEditing && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleUndo} 
                disabled={!canUndo}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleRedo} 
                disabled={!canRedo}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={isEditing ? 'default' : 'outline'}
            onClick={toggleEditMode}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4" />
                View Mode
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Mode
              </>
            )}
          </Button>
          {isEditing && onXmlChange && (
            <Button size="sm" variant="secondary" onClick={handleSaveChanges} className="gap-2">
              Save Changes
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* BPMN Container */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        <div 
          ref={containerRef} 
          className={cn('bpmn-container h-full w-full', !isEditing && 'view-mode')} 
        />
      </div>
    </div>
  );
};
