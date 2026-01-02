import { html } from 'htm/preact';
import { useRef, useEffect } from 'preact/hooks';
import { useBoardStore } from '../context/Store.js';

export function Canvas() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const { isAnimating, setIsAnimating, designCompleted, isDesignReady, nodes, edges, view } = useBoardStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let startTime = null;

        // Resize handler
        const resize = () => {
            if (containerRef.current && canvas) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        // Animation Loop
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / 1000; // in seconds

            // Clear Canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const boardW = 400;
            const boardH = 300;

            // --- Phase 1: The Substrate (0s - 0.5s) ---
            if (progress > 0) {
                const p1 = Math.min(1, progress / 0.5);
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.scale(p1, p1);

                // Glow
                ctx.shadowColor = "rgba(0, 51, 102, 0.5)";
                ctx.shadowBlur = 20;

                // Board
                ctx.fillStyle = "#003366";
                ctx.beginPath();
                ctx.roundRect(-boardW / 2, -boardH / 2, boardW, boardH, 10);
                ctx.fill();
                ctx.restore();
            }

            // --- Phase 2: Pads & Vias (0.5s - 1.5s) ---
            if (progress > 0.5) {
                const p2 = Math.min(1, (progress - 0.5)); // 0 to 1 over 1s
                const count = 50;
                // Use a seeded random or deterministic placement based on index
                for (let i = 0; i < count * p2; i++) {
                    const x = (Math.sin(i * 123) * (boardW / 2 - 20)) + centerX;
                    const y = (Math.cos(i * 234) * (boardH / 2 - 20)) + centerY;

                    ctx.beginPath();
                    if (i % 3 === 0) {
                        // Gold Pad
                        ctx.fillStyle = "#FFD700";
                        ctx.arc(x, y, 3, 0, Math.PI * 2);
                    } else {
                        // Silver Via
                        ctx.fillStyle = "#C0C0C0";
                        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                    }
                    ctx.fill();
                }
            }

            // --- Phase 3: Components (1.5s - 2.5s) ---
            if (progress > 1.5) {
                const p3 = Math.min(1, (progress - 1.5));

                // Draw some fake components
                const components = [
                    { x: 0, y: 0, w: 80, h: 80 }, // MCU
                    { x: -100, y: -50, w: 20, h: 40 },
                    { x: 100, y: 50, w: 30, h: 30 },
                    { x: -50, y: 100, w: 60, h: 20 },
                ];

                ctx.save();
                ctx.translate(centerX, centerY);

                components.forEach((comp, i) => {
                    // Stagger animation
                    const startAt = i * 0.1;
                    const localP = Math.max(0, Math.min(1, (p3 - startAt) * 2)); // Ease in

                    if (localP > 0) {
                        ctx.save();
                        ctx.translate(comp.x, comp.y);
                        ctx.scale(localP, localP);

                        // Body
                        ctx.fillStyle = "#111";
                        ctx.fillRect(-comp.w / 2, -comp.h / 2, comp.w, comp.h);

                        // Pins
                        ctx.fillStyle = "#C0C0C0";
                        ctx.fillRect(-comp.w / 2 - 2, -comp.h / 2 + 2, 2, 4);
                        ctx.fillRect(comp.w / 2, -comp.h / 2 + 2, 2, 4);

                        ctx.restore();
                    }
                });
                ctx.restore();
            }

            // --- Phase 4: Traces (2.5s - 4.0s) ---
            if (progress > 2.5) {
                const p4 = Math.min(1, (progress - 2.5) / 1.5);

                ctx.strokeStyle = "#4cc9f0";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";

                // Simulate traces drawing
                const traceLength = 100 * p4;

                // Simple sine wave traces for demo
                ctx.beginPath();
                for (let i = 0; i < 20; i++) {
                    const startX = centerX + (i - 10) * 15;
                    const startY = centerY - 100;

                    ctx.moveTo(startX, startY);
                    // Draw partial line
                    ctx.lineTo(startX, startY + (200 * p4));
                }
                ctx.stroke();
            }

            if (progress < 4.0) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false); // End animation
                designCompleted(); // Unlock 3D view
            }
        };

        if (isAnimating) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Draw static state or clear
        }

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isAnimating]);

    return html`
        <div ref=${containerRef} class="canvas-container" style="width: 100%; height: 100%; position: relative; overflow: hidden;">
            <!-- 1. Animation Canvas -->
            <canvas ref=${canvasRef} style="display: ${isAnimating ? 'block' : 'none'}; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 10;"></canvas>
            
            <!-- 2. 2D Schematic View (Visible when not animating and design is ready) -->
            ${!isAnimating && isDesignReady && nodes.length > 0 && html`
                <div style="transform: translate(${view.x}px, ${view.y}px) scale(${view.k}); transform-origin: 0 0; width: 100%; height: 100%; position: absolute;">
                    <svg style="width: 100%; height: 100%; overflow: visible; position: absolute;">
                        ${edges.map(e => {
        const f = nodes.find(n => n.id === e.from);
        const t = nodes.find(n => n.id === e.to);
        if (!f || !t) return null;
        return html`<line x1=${f.x + 25} y1=${f.y + 20} x2=${t.x + 25} y2=${t.y + 20} stroke="#38bdf8" stroke-width="2" />`;
    })}
                    </svg>
                    ${nodes.map(n => html`
                        <div style="position: absolute; left: ${n.x}px; top: ${n.y}px; width: 60px; height: 40px; background: #18181b; border: 1px solid #38bdf8; border-radius: 6px; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75em; font-family: var(--font-mono); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                            ${n.id}
                        </div>
                    `)}
                </div>
            `}

            <!-- 3. Empty State / Grid Placeholder -->
            ${!isAnimating && (!isDesignReady || nodes.length === 0) && html`
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; text-align: center;">
                    <div style="font-size: 4em; opacity: 0.2; font-weight: 600;">Grid</div>
                    <div style="font-size: 1em; opacity: 0.4; margin-top: 8px;">Waiting for design...</div>
                </div>
            `}
        </div>
    `;
}
