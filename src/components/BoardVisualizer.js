import { html } from 'htm/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useBoardStore } from '../context/Store.js';

// --- ASSETS: SVG PATHS FOR COMPONENTS ---
const COMPONENT_ASSETS = {
    // A simplified path representing the ESP32-WROOM form factor + Antenna area
    esp32: {
        path: new Path2D("M10 0 H40 V10 H50 V60 H0 V10 H10 V0 Z M15 5 H35 V10 H15 V5"), // Body + Antenna
        color: "#18181b", // Chip Body Black
        pins: 38,
        label: "ESP32",
        width: 60,
        height: 70
    },
    // Generic square sensor (like MPU-6050)
    sensor: {
        path: new Path2D("M0 0 H20 V20 H0 Z"),
        color: "#27272a",
        pins: 16, // QFN style
        label: "MPU",
        width: 24,
        height: 24
    },
    // LoRa Module (Rectangular)
    lora: {
        path: new Path2D("M0 0 H40 V30 H0 Z"),
        color: "#0f172a", // Dark Blue/Black
        pins: 16,
        label: "LoRa",
        width: 45,
        height: 35
    },
    // GPS Module (Ceramic Antenna Style)
    gps: {
        path: new Path2D("M0 0 H35 V35 H0 Z M5 5 H30 V30 H5 Z"), // Body + Ceramic Patch
        color: "#d4d4d8", // Ceramic White/Grey
        pins: 4,
        label: "GPS",
        width: 40,
        height: 40
    }
};

export function BoardVisualizer() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
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

        // --- HELPER: DRAW COMPONENT ---
        const drawComponent = (key, cx, cy, scale = 1, progress) => {
            const asset = COMPONENT_ASSETS[key];
            if (!asset) return;

            ctx.save();
            ctx.translate(cx, cy);
            // Scale up effect
            const s = scale * Math.min(1, progress * 1.5);
            ctx.scale(s, s);
            ctx.translate(-asset.width / 2, -asset.height / 2); // Center pivot

            // 1. Draw Body
            ctx.fillStyle = asset.color;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;
            ctx.fill(asset.path);

            // 2. Draw Label (Silkscreen)
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "4px monospace";
            ctx.fillText(asset.label, 4, asset.height - 4);

            // 3. Draw Pins (Silver Pads)
            ctx.fillStyle = "#e4e4e7"; // Silver
            // Simple logic: draw pads around the perimeter
            if (progress > 0.5) {
                const padSize = 2;
                // Top/Bottom
                for (let i = 0; i < asset.width; i += 6) {
                    ctx.fillRect(i, -2, padSize, padSize); // Top
                    ctx.fillRect(i, asset.height, padSize, padSize); // Bottom
                }
                // Left/Right
                for (let i = 0; i < asset.height; i += 6) {
                    ctx.fillRect(-2, i, padSize, padSize); // Left
                    ctx.fillRect(asset.width, i, padSize, padSize); // Right
                }
            }
            ctx.restore();
        };

        const drawScene = (progress) => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            if (width === 0 || height === 0) return;

            // --- 1. PCB SUBSTRATE (The Board) ---
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

            // Board Shape
            ctx.beginPath();
            ctx.roundRect(x, y, boardW, boardH, 16);
            ctx.fillStyle = '#003366'; // Pro Blue
            ctx.fill();

            // Micro-detail: Mounting Holes
            ctx.fillStyle = '#09090b'; // Hole color (bg)
            ctx.beginPath();
            ctx.arc(x + 15, y + 15, 4, 0, Math.PI * 2); // TL
            ctx.arc(x + boardW - 15, y + 15, 4, 0, Math.PI * 2); // TR
            ctx.arc(x + 15, y + boardH - 15, 4, 0, Math.PI * 2); // BL
            ctx.arc(x + boardW - 15, y + boardH - 15, 4, 0, Math.PI * 2); // BR
            ctx.fill();
            // Hole Gold Ring
            ctx.strokeStyle = '#fbbf24'; // Gold plating
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.strokeStyle = '#2563eb'; // Edge Cut
            ctx.lineWidth = 1;
            ctx.stroke(); // Re-stroke board border
            ctx.restore();

            // --- 2. COMPONENTS (SVG Style) ---
            if (progress > 0.3) {
                const pComp = Math.min(1, (progress - 0.3) / 0.4);

                // ESP32 (Center Left)
                drawComponent('esp32', x + boardW * 0.25, y + boardH * 0.5, 1.5, pComp);

                // LoRa (Center Right)
                drawComponent('lora', x + boardW * 0.75, y + boardH * 0.3, 1.2, pComp);

                // GPS (Top Right)
                drawComponent('gps', x + boardW * 0.75, y + boardH * 0.7, 1.2, pComp);

                // MPU Sensor (Center)
                drawComponent('sensor', x + boardW * 0.5, y + boardH * 0.5, 1.0, pComp);
            }

            // --- 3. TRACES (The Wires) ---
            if (progress > 0.6) {
                const pTrace = Math.min(1, (progress - 0.6) / 0.4);
                ctx.strokeStyle = '#38bdf8'; // Electric Cyan
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 5;

                // Draw realistic paths between the component locations
                const traces = [
                    // ESP to MPU
                    { x1: x + boardW * 0.28, y1: y + boardH * 0.5, x2: x + boardW * 0.48, y2: y + boardH * 0.5 },
                    // ESP to LoRa
                    { x1: x + boardW * 0.25, y1: y + boardH * 0.45, x2: x + boardW * 0.72, y2: y + boardH * 0.3 },
                    // ESP to GPS
                    { x1: x + boardW * 0.25, y1: y + boardH * 0.55, x2: x + boardW * 0.72, y2: y + boardH * 0.7 }
                ];

                traces.forEach((t, i) => {
                    if (pTrace > (i / traces.length)) {
                        ctx.beginPath();
                        ctx.moveTo(t.x1, t.y1);

                        // Dog-leg routing (Standard PCB style 45 degrees)
                        const midX = (t.x1 + t.x2) / 2;
                        ctx.lineTo(midX, t.y1);
                        ctx.lineTo(midX, t.y2);
                        ctx.lineTo(t.x2, t.y2);
                        ctx.stroke();
                    }
                });
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
                setAnimating(false);
                setHasGenerated(true);
                designCompleted();
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
                    <p style="font-weight: 500; color: #71717a;">Ready to Design</p>
                    <p style="font-size: 12px; opacity: 0.5;">AI Workflow Initialized</p>
                </div>
            `}
        </div>
    `;
}