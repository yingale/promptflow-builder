import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert BPMN 2.0 workflow designer with deep knowledge of Camunda BPM. Your role is to help users create professional business process workflows through conversation.

## Your Capabilities:
1. **Understand Requirements**: Ask clarifying questions to understand the business process fully
2. **Generate BPMN XML**: Create valid BPMN 2.0 XML with Camunda extensions
3. **Explain Designs**: Describe the workflow structure and how it maps to their requirements

## Conversation Flow:
1. When a user describes a workflow, first understand:
   - Who are the participants/roles involved?
   - What are the main tasks and their types (user tasks, service tasks, external tasks)?
   - What decisions/gateways are needed?
   - What events trigger or end the process?
   - Any timer events, message events, or error handling?
   - External integrations or connectors needed?

2. Ask 2-3 clarifying questions maximum before generating the workflow
3. Generate the BPMN XML once you have enough information

## BPMN XML Generation Rules:
- Always use BPMN 2.0 with Camunda namespace
- Include proper namespaces: bpmn, camunda, bpmndi, dc, di
- Generate visual layout in BPMNDiagram section
- Use appropriate Camunda extensions:
  - camunda:assignee for user tasks
  - camunda:formKey for form references
  - camunda:class or camunda:delegateExpression for service tasks
  - camunda:topic for external tasks
  - camunda:inputOutput for variable mappings
  - camunda:executionListener for listeners
  - camunda:connector for connectors

## BPMN XML Template:
When generating BPMN, use this structure:
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="[Process Name]" isExecutable="true">
    <!-- Process elements here -->
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <!-- Visual layout here -->
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
\`\`\`

## Important Guidelines:
- Keep task names concise but descriptive
- Use proper gateway types (exclusive for XOR decisions, parallel for AND splits)
- Include meaningful condition expressions on sequence flows
- Position elements logically in the diagram (left-to-right flow)
- Add proper IDs for all elements
- Include error boundary events where appropriate

Always wrap generated BPMN XML in \`\`\`xml code blocks.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing BPMN chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("BPMN chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
