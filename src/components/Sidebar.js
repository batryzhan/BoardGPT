import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useBoardStore } from '../context/Store.js';
import { useGemini } from '../hooks/useGemini.js';
import { Zap, Send, StopCircle, Sparkles } from 'lucide-preact';
import { parse } from 'marked';

export function Sidebar() {
    const [input, setInput] = useState('');
    const {
        isGenerating,
        workflowStep,
        currentPlan,
        resetWorkflow,
        startAnimation,
        isAnimating
    } = useBoardStore();

    const { generatePlan, generateDesign, error } = useGemini();
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentPlan, workflowStep, error]);

    const handleSend = () => {
        if (!input.trim()) return;
        if (workflowStep === 'idle') {
            generatePlan(input);
        } else if (workflowStep === 'review') {
            generateDesign(input, currentPlan);
        }
        setInput('');
    };

    const handleConfirm = () => {
        startAnimation();
        // Trigger actual generation
        generateDesign(input, currentPlan);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Render Markup safer
    const renderMarkdown = (text) => {
        return { __html: parse(text || '') };
    };

    return html`
        <aside class="sidebar" style="width: 40%; min-width: 400px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-dark); position: relative;">
            
            <div class="header" style="height: 60px; padding: 0 24px; display: flex; align-items: center; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                        <${Sparkles} size=${14} color="white" />
                    </div>
                    <h2 style="font-size: 16px; font-weight: 600; color: white; letter-spacing: -0.5px;">BoardGPT</h2>
                    <span style="background: linear-gradient(135deg, #8b5cf6, #d946ef); padding: 2px 6px; border-radius: 99px; font-size: 10px; font-weight: 700; color: white; letter-spacing: 0.5px;">PRO</span>
                </div>
            </div>
            
            <div ref=${scrollRef} class="chat-stream" style="flex: 1; padding: 24px; overflow-y: auto; padding-bottom: 100px;">
                
                ${workflowStep === 'idle' && !isGenerating && !currentPlan && html`
                    <div style="text-align: center; margin-top: 40px; color: var(--text-secondary);">
                        <p style="font-size: 1.1em; margin-bottom: 8px;">What are we building today?</p>
                        <p style="font-size: 0.9em; opacity: 0.6;">Describe your PCB requirements (e.g. "Smart Weather Station with ESP32")</p>
                    </div>
                `}

                ${error && html`
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-bottom: 16px; color: #f87171;">
                        <strong>Error:</strong> ${error}
                    </div>
                `}

                ${(currentPlan || isGenerating) && html`
                    <div class="message-card" style="background: var(--panel-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                            <${Zap} size=${16} color="var(--accent)" />
                            <span style="font-weight: 500; font-size: 13px; color: var(--text-secondary);">GENERATION PHASE: ${workflowStep.toUpperCase()}</span>
                        </div>
                        
                        <div class="markdown-body" dangerouslySetInnerHTML=${renderMarkdown(currentPlan)} />
                        
                        ${isGenerating && html`
                            <div style="margin-top: 16px; display: flex; align-items: center; gap: 8px; color: var(--accent);">
                                <${Zap} size=${14} class="spin" />
                                <span style="font-size: 12px; font-weight: 500;">Processing...</span>
                            </div>
                        `}
                    </div>
                `}
                
                ${workflowStep === 'complete' && html`
                    <div class="message-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <p style="color: #4ade80; font-weight: 500;">✓ Design Generated Successfully!</p>
                        <p style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">Check the visualization panel on the right.</p>
                    </div>
                `}
            </div>

            <div style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 600px;">
                ${workflowStep === 'review' ? html`
                    <div style="display: flex; gap: 12px; background: rgba(24, 24, 27, 0.8); backdrop-filter: blur(12px); padding: 8px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                        <button onClick=${resetWorkflow} style="flex: 1; padding: 12px; cursor: pointer; background: transparent; border: none; color: var(--text-secondary); font-weight: 500; border-radius: 99px; transition: background 0.2s;">
                            Cancel
                        </button>
                        <button 
                            onClick=${handleConfirm}
                            disabled=${isAnimating}
                            style="flex: 2; border: none; cursor: pointer; background: ${isAnimating ? '#333' : 'var(--accent)'}; color: white; border-radius: 99px; font-weight: 600; box-shadow: 0 0 15px var(--accent-glow); transition: all 0.3s;"
                        >
                            ${isAnimating ? 'Generating...' : 'Confirm Plan'}
                        </button>
                    </div>
                ` : html`
                    <div style="position: relative; background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 4px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                        <textarea 
                            value=${input} 
                            onInput=${e => setInput(e.target.value)}
                            onKeyDown=${handleKeyDown}
                            placeholder="Describe your device..." 
                            disabled=${isGenerating}
                            style="width: 100%; height: 50px; background: transparent; border: none; color: white; padding: 14px 50px 14px 16px; resize: none; font-family: var(--font-sans); font-size: 14px; outline: none;"
                        ></textarea>
                        
                        <button 
                            onClick=${handleSend}
                            disabled=${isGenerating || !input.trim()}
                            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; background: ${input.trim() ? 'var(--accent)' : '#333'}; border: none; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                        >
                            ${isGenerating ? html`<${StopCircle} size=${16} color="white" />` : html`<${Send} size=${16} color="white" />`}
                        </button>
                    </div>
                `}
            </div>
        </aside>
    `;
}