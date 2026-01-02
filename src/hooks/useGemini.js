import { useState } from 'preact/hooks';
import { useBoardStore } from '../context/Store.js';
import { CONFIG } from '../config.js';
import { parseBoardResponse } from '../utils/parser.js';

export function useGemini() {
    const { loadDesign, setIsGenerating, setWorkflowStep, setCurrentPlan, autoLayout } = useBoardStore();
    const [error, setError] = useState(null);

    const callLLM = async (prompt) => {
        try {
            const response = await fetch(CONFIG.OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: CONFIG.OLLAMA_MODEL, prompt, stream: false })
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "Unknown");
                throw new Error(`Ollama Server Error (${response.status}): ${errorBody}`);
            }

            const data = await response.json();
            return data.response;
        } catch (e) {
            if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
                throw new Error("Ollama Connection Failed. Please ensure Ollama is running and OLLAMA_ORIGINS='*' is set.");
            }
            throw e;
        }
    };

    const generatePlan = async (input) => {
        setIsGenerating(true); setWorkflowStep('planning');
        try {
            const res = await callLLM(`Plan PCB for: ${input}. Markdown only.`);
            setCurrentPlan(res); setWorkflowStep('review');
        } catch (e) { setError(e.message); setWorkflowStep('idle'); }
        finally { setIsGenerating(false); }
    };

    const generateDesign = async (input, plan) => {
        setIsGenerating(true); setWorkflowStep('designing');
        try {
            const res = await callLLM(`Create a PCB Design JSON. Output ONLY a valid JSON object with a "components" array. Each component must have: "id" (string), "type" (string), "x" (number), "y" (number), and "connections" array (objects with "target", "type"). Plan Context: ${plan}`);
            const components = parseBoardResponse(res);

            if (!components || components.length === 0) {
                throw new Error("AI failed to generate valid components. Please try again.");
            }

            const edges = [];
            components.forEach(c => c.connections.forEach(conn => edges.push({ from: c.id, to: conn.target, label: conn.type })));
            loadDesign({ components, connections: edges });
            setWorkflowStep('complete');
        } catch (e) { setError(e.message); setWorkflowStep('review'); }
        finally { setIsGenerating(false); }
    };

    return { generatePlan, generateDesign, error };
}
