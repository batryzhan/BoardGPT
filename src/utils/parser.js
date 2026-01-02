export function parseBoardResponse(text) {
    try {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\[|\{)[\s\S]*(\]|\})/);
        if (!jsonMatch) return [];
        let data = JSON.parse(jsonMatch[0].replace(/```json\s?|```/g, ''));
        if (!Array.isArray(data)) data = data.components || [data];

        const seenIds = new Set();
        return data.map((comp, i) => {
            const type = (comp.component_type || comp.type || 'Unknown').toLowerCase();
            const id = comp.id || `${type.charAt(0).toUpperCase()}${i + 1}`;
            let finalId = id;
            let count = 2;
            while (seenIds.has(finalId.toLowerCase())) { finalId = `${id}_${count++}`; }
            seenIds.add(finalId.toLowerCase());

            return {
                ...comp,
                id: finalId,
                component_type: type,
                x: typeof comp.x === 'number' ? comp.x : (i % 3) * 100,
                y: typeof comp.y === 'number' ? comp.y : Math.floor(i / 3) * 80,
                connections: Array.isArray(comp.connections) ? comp.connections : []
            };
        });
    } catch (e) { console.error(e); return []; }
}
