export const CONFIG = {
    // Ollama Configuration (Local LLM)
    USE_OLLAMA: true,
    OLLAMA_URL: "http://127.0.0.1:11434/api/generate",
    OLLAMA_MODEL: "ministral-3:14b-cloud",

    // Legacy API settings (not used when USE_OLLAMA is true)
    API_KEY: "AIzaSyADe1GITj8tprpnRz2hVqb3padYvmTpQyo",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",

    GRID_SIZE: 20,
    COLORS: {
        mcu: '#0ea5e9',
        sensor: '#22c55e',
        power: '#ef4444',
        trace: '#06b6d4'
    }
};
