import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { html } from 'htm/preact';

const BoardContext = createContext();

export const useBoardStore = () => useContext(BoardContext);

export function BoardProvider({ children }) {
    // Canvas State
    const [view, setView] = useState({ x: 0, y: 0, k: 1 }); // k = scale (zoom)
    const [is3DMode, setIs3DMode] = useState(false);

    // Data State
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // UI State
    const [selection, setSelection] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDesignReady, setIsDesignReady] = useState(false);

    // Workflow State
    const [workflowStep, setWorkflowStep] = useState('idle'); // idle, planning, review, designing, complete
    const [currentPlan, setCurrentPlan] = useState('');

    // Actions
    const startAnimation = () => { setIsAnimating(true); setIsDesignReady(false); };
    const designCompleted = () => setIsDesignReady(true);

    // Actions
    const addNode = (node) => {
        setNodes(prev => [...prev, { ...node, x: node.x || 0, y: node.y || 0 }]);
    };

    const updateNodePos = (id, x, y) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
    };

    const autoLayout = () => {
        setNodes(prev => {
            if (prev.length === 0) return prev;

            const spacingX = 250;
            const spacingY = 180;
            const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(prev.length * 1.5))));

            return prev.map((node, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                return {
                    ...node,
                    x: col * spacingX,
                    y: row * spacingY
                };
            });
        });

        setTimeout(() => {
            setView({ x: 150, y: 150, k: 0.75 });
        }, 100);
    };

    const loadDesign = (design) => {
        setNodes(design.components || []);
        setEdges(design.connections || []);
        setView({ x: 150, y: 150, k: 0.7 });
    };

    const resetWorkflow = () => {
        setWorkflowStep('idle');
        setCurrentPlan('');
    };

    const value = {
        view, setView,
        is3DMode, setIs3DMode,
        nodes, setNodes,
        edges, setEdges,
        selection, setSelection,
        isGenerating, setIsGenerating,
        isAnimating, setIsAnimating, startAnimation,
        isDesignReady, designCompleted,
        workflowStep, setWorkflowStep,
        currentPlan, setCurrentPlan,
        resetWorkflow,
        addNode, updateNodePos, loadDesign, autoLayout
    };

    return html`<${BoardContext.Provider} value=${value}>${children}<//>`;
}
