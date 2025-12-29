
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { performWebSearch, analyzeCode } from '../services/geminiService';
import { memoryService } from '../services/memoryService';
import { Message, MemoryTier } from '../types';
import { aiRouter } from '../services/ai/router';
import { MODEL_REGISTRY } from '../services/ai/config/model-registry';

export const useAgentRuntime = () => {
  const store = useStore();

  // --- Tool Execution Logic ---
  const executeTools = async (functionCalls: any[]): Promise<any[]> => {
    const results = [];
    for (const call of functionCalls) {
      const { name, args, id } = call;
      let resultString = "";
      
      memoryService.workingMemory.pushThought(`Invoking tool: ${name} with params: ${JSON.stringify(args)}`);

      if (name === 'web_search') {
        const res = await performWebSearch(args.query);
        resultString = res.text;
      } else if (name === 'code_analysis') {
        const res = await analyzeCode(args.code, args.focus);
        resultString = res.text;
      } else {
        resultString = "Tool not found.";
      }
      
      results.push({ id, name, response: { result: resultString } });
      memoryService.workingMemory.updateScratchpad(`tool_result_${name}`, resultString.substring(0, 50) + "...");
    }
    return results;
  };

  // --- Main Orchestrator Loop ---
  useEffect(() => {
    const processLoop = async () => {
      // Guard clauses
      if (store.isPlanning || store.executionPlan.length === 0) return;
      
      const { executionPlan, planResults, isLoading, setAgentStatus, updatePlanStep, addPlanResult, setIsLoading, addMessage, agents, selectedModelId } = store;

      // Find next runnable step
      const nextStep = executionPlan.find(step => 
        step.status === 'pending' && 
        step.dependencies.every(depId => executionPlan.find(p => p.id === depId)?.status === 'completed')
      );

      if (nextStep) {
        // EXECUTE STEP
        const agent = agents.find(a => a.id === nextStep.agentId) || agents[0];
        setAgentStatus(agent.id, 'executing');
        updatePlanStep(nextStep.id, { status: 'active' });
        
        memoryService.workingMemory.pushThought(`Agent ${agent.name} starting step: ${nextStep.description}`);

        try {
            const dependencyResults = nextStep.dependencies.map(depId => 
                `[Input from Step ${depId}]: ${planResults[depId] || '(No output)'}`
            ).join('\n\n');

            const wmSnapshot = JSON.stringify(memoryService.workingMemory.getSnapshot().scratchpad);
            const taskContext = `GOAL: ${nextStep.description}\nDEPENDENCY CONTEXT: ${dependencyResults}\nACTIVE SCRATCHPAD: ${wmSnapshot}`;
            
            // Define capabilities required by this agent
            const requiredCapabilities = [];
            if (agent.role === 'Engineer' || agent.role === 'Analyst') requiredCapabilities.push('toolCalling');
            if (agent.role === 'Designer') requiredCapabilities.push('vision');

            // Use Universal Router
            let response = await aiRouter.chat({
                modelId: selectedModelId,
                messages: [{ role: 'user', content: `TASK CONTEXT:\n${taskContext}` }],
                systemPrompt: `${agent.systemPrompt}\n\nYou have access to tools. Use them if necessary.`,
                tools: (agent.capabilities.includes('Deep Web Search') || agent.capabilities.includes('React/TypeScript')) ? 
                   [{ name: 'web_search', description: 'Search web', parameters: { type: 'object', properties: { query: { type: 'string' } } } }] : undefined,
                // @ts-ignore
                capabilities: requiredCapabilities
            });

            store.updateMetrics(response.usage?.totalTokenCount || 0);

            // Handle Tools
            if (response.toolCalls && response.toolCalls.length > 0) {
                 const toolMsgId = `tool-${Date.now()}`;
                 addMessage({
                    id: toolMsgId, role: 'model', agentId: agent.id, content: response.thinking || "Executing tools...", timestamp: Date.now(),
                    toolCalls: response.toolCalls.map(fc => ({ id: fc.id || 'unknown', toolName: fc.name, args: fc.args, status: 'pending' }))
                 });
                 
                 const toolResponses = await executeTools(response.toolCalls);
                 
                 store.updateMessage(toolMsgId, {
                    toolCalls: response.toolCalls.map(fc => {
                        const res = toolResponses.find(tr => tr.name === fc.name);
                        return { id: fc.id || 'unknown', toolName: fc.name, args: fc.args, status: 'success', result: res ? JSON.stringify(res.response).substring(0, 100) : "Done" };
                    })
                 });
                 
                 // Follow up
                 response = await aiRouter.chat({
                     modelId: selectedModelId,
                     messages: [
                         { role: 'user', content: `TASK CONTEXT:\n${taskContext}` },
                         { role: 'model', content: "Tool calls made." },
                         { role: 'user', content: `Tool Results: ${JSON.stringify(toolResponses)}` }
                     ],
                     systemPrompt: agent.systemPrompt
                 });
            }

            addPlanResult(nextStep.id, response.text);
            memoryService.workingMemory.updateScratchpad(`step_output_${nextStep.id.substring(0,4)}`, response.text.substring(0, 50));
            await memoryService.addMemory(
                `Agent ${agent.name} completed: ${nextStep.description}`, 
                MemoryTier.SHORT_TERM, [agent.role]
            );

            setAgentStatus(agent.id, 'idle');
            updatePlanStep(nextStep.id, { status: 'completed' });
            addMessage({
                id: `res-${nextStep.id}`, role: 'model', agentId: agent.id, content: response.text, thinking: response.thinking, timestamp: Date.now()
            });

        } catch (e) {
            console.error("Step execution failed", e);
            store.updateMetrics(0, true);
            updatePlanStep(nextStep.id, { status: 'failed' });
            addMessage({ id: `fail-${nextStep.id}`, role: 'system', content: `Task Failed: ${(e as Error).message}`, timestamp: Date.now() });
            setAgentStatus(agent.id, 'idle');
        }

      } else {
        // CHECK FOR COMPLETION
        const allComplete = executionPlan.every(p => p.status === 'completed');
        const anyFailed = executionPlan.some(p => p.status === 'failed');

        if ((allComplete || anyFailed) && isLoading) {
            setIsLoading(false);
            setAgentStatus('coordinator', 'thinking');
            
            if (!anyFailed) {
                try {
                    const finalSynthesis = await aiRouter.chat({
                        modelId: selectedModelId,
                        messages: [{ role: 'user', content: `All steps complete. Synthesize these results:\n${JSON.stringify(planResults)}` }],
                        systemPrompt: "You are the Coordinator. Summarize the findings."
                    });

                    store.updateMetrics(finalSynthesis.usage?.totalTokenCount || 0);
                    
                    addMessage({
                        id: `final-${Date.now()}`, role: 'model', agentId: 'coordinator', content: finalSynthesis.text, thinking: finalSynthesis.thinking, timestamp: Date.now()
                    });

                } catch (e) {
                    store.setError("Final synthesis failed");
                }
            }
            setAgentStatus('coordinator', 'idle');
        }
      }
    };

    const interval = setInterval(processLoop, 500); 
    return () => clearInterval(interval);
  }, [store.executionPlan, store.planResults, store.isLoading, store.isPlanning]);

  // --- Initial Trigger ---
  const handleSendMessage = async (text: string) => {
    store.setError(null);
    store.addMessage({ id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() });
    store.setIsLoading(true);
    store.setIsPlanning(true);
    store.setAgentStatus('coordinator', 'thinking');
    store.resetPlan();

    try {
      await memoryService.addMemory(text, MemoryTier.SHORT_TERM, ['user_query']);
      const relevantMemory = await memoryService.getContext(text);
      
      const response = await aiRouter.chat({
          modelId: store.selectedModelId,
          messages: [{ 
            role: 'user', 
            content: `
              Context: ${relevantMemory}
              User Request: ${text}
              Available Agents: Coordinator, Coder, Researcher, Creative.
              Create a JSON execution plan with id, agentId, description, dependencies.
              Return ONLY JSON.
            ` 
          }],
          systemPrompt: "You are an Orchestrator. Output valid JSON only."
      });

      store.updateMetrics(response.usage?.totalTokenCount || 0);
      
      let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const plan = JSON.parse(jsonStr).map((p: any) => ({ ...p, status: 'pending' }));

      store.setExecutionPlan(plan);
      
      const planMsg: Message = {
        id: `plan-${Date.now()}`,
        role: 'model',
        agentId: 'coordinator',
        type: 'plan',
        content: `I have devised an execution plan using **${MODEL_REGISTRY.find(m => m.id === store.selectedModelId)?.name}**:\n\n` + plan.map((s: any) => `• **${s.agentId}**: ${s.description}`).join('\n'),
        timestamp: Date.now(),
        thinking: response.thinking
      };
      store.addMessage(planMsg);
      store.setAgentStatus('coordinator', 'idle');
      store.setIsPlanning(false); 
    } catch (e: any) {
      store.setError(e.message || "Planning Failed");
      store.setIsLoading(false);
      store.setIsPlanning(false);
      store.setAgentStatus('coordinator', 'idle');
    }
  };

  return { handleSendMessage };
};
