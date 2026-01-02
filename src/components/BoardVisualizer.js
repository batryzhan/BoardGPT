import { html } from 'htm/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useBoardStore } from '../context/Store.js';

export function BoardVisualizer() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Достаем designCompleted из стора
    const { isAnimating, setAnimating, designCompleted } = useBoardStore();

    const [hasGenerated, setHasGenerated] = useState(false);

    useEffect(() => {
        if (!isAnimating && !hasGenerated) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let startTime = null;

        const updateSize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            if (!isAnimating && hasGenerated) drawScene(1.0);
        };

        const drawScene = (progress) => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            if (width === 0 || height === 0) return;

            // --- Плата ---
            const pBoard = Math.min(1, progress / 0.2);
            const boardW = Math.min(600, width * 0.85);
            const boardH = Math.min(400, height * 0.85);
            const x = (width - boardW) / 2;
            const y = (height - boardH) / 2;

            ctx.save();
            const scale = 0.5 + (0.5 * pBoard);
            const centerX = width / 2;
            const centerY = height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);

            ctx.beginPath();
            ctx.roundRect(x, y, boardW, boardH, 12);
            ctx.fillStyle = '#003366';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 40;
            ctx.fill();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // --- Контакты ---
            if (progress > 0.2) {
                const pPads = Math.min(1, (progress - 0.2) / 0.3);
                const padCount = 50;
                ctx.fillStyle = '#FFD700';
                for (let i = 0; i < padCount; i++) {
                    const seedX = (i * 9301 + 49297) % 233280;
                    const seedY = (i * 49297 + 9301) % 233280;
                    const px = x + 30 + (seedX % (boardW - 60));
                    const py = y + 30 + (seedY % (boardH - 60));
                    if (pPads > (i / padCount)) {
                        ctx.beginPath();
                        ctx.arc(px, py, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            // --- Дорожки ---
            if (progress > 0.5) {
                const pTrace = Math.min(1, (progress - 0.5) / 0.5);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 8;
                const traceCount = 20;
                for (let i = 0; i < traceCount; i++) {
                    const seed = i * 123;
                    const startX = x + 40 + (seed % (boardW - 80));
                    const startY = y + 40 + ((i * 321) % (boardH - 80));
                    const endX = startX + 60;
                    const endY = startY + (i % 2 === 0 ? 30 : -30);
                    if (pTrace > (i / traceCount)) {
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(startX, endY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                    }
                }
            }
        };

        const render = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const DURATION = 3500;
            const progress = isAnimating ? Math.min(elapsed / DURATION, 1) : 1.0;

            drawScene(progress);

            if (progress < 1 && isAnimating) {
                animationFrameId = requestAnimationFrame(render);
            } else if (progress >= 1 && isAnimating) {
                // --- ВАЖНЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ ---
                setAnimating(false);
                setHasGenerated(true);
                designCompleted(); // <--- ЭТА ФУНКЦИЯ РАЗБЛОКИРУЕТ КНОПКУ 3D
            }
        };

        updateSize();
        animationFrameId = requestAnimationFrame(render);
        window.addEventListener('resize', updateSize);

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isAnimating, hasGenerated]);

    return html`
        <div ref=${containerRef} style="flex: 1; height: 100%; position: relative; background: #09090b; overflow: hidden;">
            <div style="position: absolute; inset: 0; background-image: radial-gradient(#27272a 1px, transparent 1px); background-size: 24px 24px; opacity: 0.5; pointer-events: none;"></div>
            <canvas ref=${canvasRef} style="display: block; width: 100%; height: 100%;" />
            
            ${!isAnimating && !hasGenerated && html`
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #52525b; text-align: center;">
                    <p>System Ready</p>
                    <p style="font-size: 12px; opacity: 0.7;">Waiting for generated plan...</p>
                </div>
            `}
        </div>
    `;
}

//wierjietnbiejtibweitvk
