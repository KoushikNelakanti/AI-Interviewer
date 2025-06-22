// server.js (Simplified for Vercel deployment)

require('dotenv').config(); // Load environment variables (Vercel provides these differently)

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
// Vercel sets process.env.PORT automatically
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // You might configure this more strictly in production if needed
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'interviewer.html'));
});
// Serve static files from the 'public' directory
app.use(express.static('public'));

// --- API Endpoints for Gemini ---
// (These routes remain the same as they correctly use server-side environment variables)

app.post('/generate-first-question', async (req, res) => {
    const { jobRole } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY; // Vercel env var

    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API Key not configured on server." });
    }
    if (!jobRole) {
        return res.status(400).json({ error: "Job role is required." });
    }

    const prompt = `You are a professional technical interviewer. Your goal is to conduct a concise and effective interview. Ask the first technical interview question for a candidate applying to the following role: '${jobRole}'. Focus on a fundamental concept relevant to the role.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(response.status).json({ error: data.error?.message || "Failed to generate question from Gemini." });
        }

        res.json({ question: data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a question." });

    } catch (error) {
        console.error("Error generating first question:", error);
        res.status(500).json({ error: "Internal server error while generating question." });
    }
});

app.post('/get-gemini-response', async (req, res) => {
    const { jobRole, conversationHistory } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY; // Vercel env var

    if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API Key not configured on server." });
    }
    if (!jobRole || !conversationHistory) {
        return res.status(400).json({ error: "Job role and conversation history are required." });
    }

    const systemInstruction = {
        role: "user",
        parts: [{ text: `You are an AI interviewer for the role: '${jobRole}'. Your current task is to provide a concise, professional follow-up question or feedback based on the candidate's last response. If the candidate's answer is sufficient, ask the next relevant technical question. If it's unclear or incomplete, ask for clarification. Keep responses interview-appropriate.` }]
    };

    const fullConversation = [systemInstruction, ...conversationHistory];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: fullConversation,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                },
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(response.status).json({ error: data.error?.message || "Failed to get Gemini response." });
        }

        res.json({ response: data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't catch that or couldn't generate a response." });

    } catch (error) {
        console.error("Error getting Gemini response:", error);
        res.status(500).json({ error: "Internal server error while getting Gemini response." });
    }
});

// --- WebSocket Server for Deepgram Streaming (attached to HTTP server) ---
const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/deepgram-ws' });

wss.on('connection', function connection(ws) {
    console.log('Client connected to Deepgram WebSocket proxy.');

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY; // Vercel env var
    if (!deepgramApiKey) {
        console.error("Deepgram API Key not configured on server.");
        ws.send(JSON.stringify({ error: "Deepgram API Key is missing on server." }));
        ws.close(1011, "API Key missing");
        return;
    }

    const deepgramWsUrl = `wss://api.deepgram.com/v1/listen?smart_format=true&punctuate=true&encoding=opus&sample_rate=48000&interim_results=true&utterance_end_ms=1000`;
    const deepgramWs = new WebSocket(deepgramWsUrl, ['token', deepgramApiKey]);

    deepgramWs.onopen = () => console.log('Connected to Deepgram API WebSocket.');
    deepgramWs.onmessage = (message) => ws.send(message.data);
    deepgramWs.onclose = (event) => {
        console.log('Disconnected from Deepgram API WebSocket:', event.code, event.reason);
        ws.close(event.code, event.reason);
    };
    deepgramWs.onerror = (error) => {
        console.error('Deepgram API WebSocket error:', error);
        ws.close(1011, "Deepgram API error");
    };

    ws.onmessage = (message) => {
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.send(message.data);
        } else {
            console.warn("Deepgram WebSocket not open, dropping message.");
        }
    };

    ws.onclose = (event) => {
        console.log('Client disconnected from Deepgram WebSocket proxy:', event.code, event.reason);
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.close();
        }
    };
    ws.onerror = (error) => {
        console.error('Client WebSocket error:', error);
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.close();
        }
    };
});
