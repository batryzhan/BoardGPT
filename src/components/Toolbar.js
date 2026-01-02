import { html } from 'htm/preact';
import { ZoomIn, ZoomOut, Save, Grid } from 'lucide-preact';
import { useBoardStore } from '../context/Store.js';

export function Toolbar() {
    const { setView, nodes, edges, autoLayout } = useBoardStore();

    const zoom = (f) => setView(v => ({ ...v, k: v.k * f }));

    return html`
        <div class="toolbar">
            <button onClick=${() => zoom(1.2)}><${ZoomIn} size=${18} /></button>
            <button onClick=${() => zoom(0.8)}><${ZoomOut} size=${18} /></button>
            <div class="sep"></div>
            <button onClick=${autoLayout} style="color: var(--accent-green)"><${Grid} size=${18} /></button>
            <button onClick=${() => console.log('Save', { nodes, edges })}><${Save} size=${18} /></button>
        </div>
    `;
}
