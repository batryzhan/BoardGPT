import { html } from 'htm/preact';
import { Sidebar } from './Sidebar.js';
import { Canvas } from './Canvas.js';
import { ThreeCanvas } from './ThreeCanvas.js';
import { Toolbar } from './Toolbar.js';
import { useBoardStore } from '../context/Store.js';

export function App() {
    const { is3DMode, setIs3DMode, isDesignReady } = useBoardStore();

    return html`
        <main class="flex" style="width: 100vw; height: 100vh;">
            <${Sidebar} />
            
            <div style="flex: 1; position: relative; background: #000;">
                <!-- Dot Grid Background -->
                <div style="position: absolute; inset: 0; background-image: radial-gradient(#333 1px, transparent 1px); background-size: 24px 24px; opacity: 0.5; pointer-events: none;"></div>

                ${is3DMode ? html`<${ThreeCanvas} />` : html`<${Canvas} />`}
                
                <${Toolbar} />

                <!-- Header Actions (ghost button) -->
                <div style="position: absolute; top: 24px; right: 24px; z-index: 10;" title=${!isDesignReady ? "Generate a PCB Plan first" : ""}>
                    <button 
                        onClick=${() => isDesignReady && setIs3DMode(!is3DMode)}
                        class="ghost-btn"
                        disabled=${!isDesignReady}
                        style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid ${isDesignReady ? '#3f3f46' : '#27272a'}; border-radius: 8px; color: ${isDesignReady ? 'white' : '#52525b'}; background: transparent; font-size: 13px; font-weight: 500; transition: all 0.2s; cursor: ${isDesignReady ? 'pointer' : 'not-allowed'}; opacity: ${isDesignReady ? 1 : 0.5};"
                        onMouseEnter=${(e) => { if (isDesignReady) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; } }}
                        onMouseLeave=${(e) => { if (isDesignReady) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = 'white'; } }}
                    >
                        ${is3DMode ? 'View Schematic' : 'View 3D Board'}
                    </button>
                </div>
            </div>
        </main>
    `;
}
