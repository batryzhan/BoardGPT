import { html } from 'htm/preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import * as THREE from 'three';
import { useBoardStore } from '../context/Store.js';

export function ThreeCanvas() {
    const containerRef = useRef(null);
    const { nodes } = useBoardStore();

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        const aspect = width / height;
        const frustumSize = 150;
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 1000
        );
        camera.position.set(0, 0, 100);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambLight);

        const resources = { geometries: [], materials: [] };
        const track = (r) => {
            if (r.isBufferGeometry) resources.geometries.push(r);
            if (r.isMaterial) resources.materials.push(r);
            return r;
        };

        // Board
        let minX = -50, maxX = 50, minY = -40, maxY = 40;
        if (nodes.length > 0) {
            minX = Math.min(...nodes.map(n => n.x || 0));
            maxX = Math.max(...nodes.map(n => n.x || 0));
            minY = Math.min(...nodes.map(n => n.y || 0));
            maxY = Math.max(...nodes.map(n => n.y || 0));
        }
        const bW = Math.max(120, (maxX - minX) + 50);
        const bH = Math.max(100, (maxY - minY) + 50);
        const cX = (minX + maxX) / 2;
        const cY = (minY + maxY) / 2;

        const boardGeo = track(new THREE.PlaneGeometry(bW, bH));
        const boardMat = track(new THREE.MeshStandardMaterial({ color: 0x0044aa, roughness: 0.3 }));
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(cX, cY, 0);
        scene.add(board);

        // Vias/Decoration (Simplified for recreation speed)
        const viaGeo = track(new THREE.CircleGeometry(0.8, 8));
        const viaMat = track(new THREE.MeshBasicMaterial({ color: 0xc0c0c0 }));
        for (let i = 0; i < 50; i++) {
            const v = new THREE.Mesh(viaGeo, viaMat);
            v.position.set(cX + (Math.random() - 0.5) * bW, cY + (Math.random() - 0.5) * bH, 0.1);
            scene.add(v);
        }

        // Nodes & Traces
        const nodeMap = new Map();
        nodes.forEach(n => nodeMap.set(n.id, n));

        const traceMat = track(new THREE.LineBasicMaterial({ color: 0x003366 }));
        const silkMat = track(new THREE.LineBasicMaterial({ color: 0xffff00 }));

        nodes.forEach(node => {
            const x = node.x || 0;
            const y = node.y || 0;
            const w = 15, h = 10;

            // Outline
            const outlinePoints = [
                new THREE.Vector3(x - w / 2, y - h / 2, 0.2), new THREE.Vector3(x + w / 2, y - h / 2, 0.2),
                new THREE.Vector3(x + w / 2, y + h / 2, 0.2), new THREE.Vector3(x - w / 2, y + h / 2, 0.2),
                new THREE.Vector3(x - w / 2, y - h / 2, 0.2)
            ];
            const outlineGeo = track(new THREE.BufferGeometry().setFromPoints(outlinePoints));
            scene.add(new THREE.Line(outlineGeo, silkMat));

            // Traces
            (node.connections || []).forEach(conn => {
                const t = nodeMap.get(conn.target);
                if (!t) return;
                const tx = t.x || 0;
                const ty = t.y || 0;
                const points = [
                    new THREE.Vector3(x, y, 0.15),
                    new THREE.Vector3((x + tx) / 2, y, 0.15),
                    new THREE.Vector3((x + tx) / 2, ty, 0.15),
                    new THREE.Vector3(tx, ty, 0.15)
                ];
                const traceGeo = track(new THREE.BufferGeometry().setFromPoints(points));
                scene.add(new THREE.Line(traceGeo, traceMat));
            });
        });

        let fId;
        const anim = () => { fId = requestAnimationFrame(anim); renderer.render(scene, camera); };
        anim();

        return () => {
            cancelAnimationFrame(fId);
            resources.geometries.forEach(g => g.dispose());
            resources.materials.forEach(m => m.dispose());
            renderer.dispose();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [nodes]);

    return html`<div ref=${containerRef} class="canvas-container" style="width: 100%; height: 100%; overflow: hidden;"></div>`;
}
