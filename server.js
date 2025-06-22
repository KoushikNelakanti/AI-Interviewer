// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws'); // Needed to connect to Deepgram
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'interviewer.html'));
});
app.use(express.static('public'));

// --- Gemini API: First Question ---
app.post('/generate-first-question', async (req, res) => {
    const { jobRole } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) return res.status(500).json({ error: "Gemini API Key not configured." });
    if (!jobRole) return res.status(400).json({ error: "Job role is required." });

    const prompt = `You are a professional technical interviewer. Ask the first technical interview question for the role: '${jobRole}'.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const question = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a question.";
        res.json({ question });
    } catch (error) {
        console.error("Gemini error:", error);
        res.status(500).json({ error: "Failed to generate question." });
    }
});

// --- Gemini API: Follow-up Responses ---
app.post('/get-gemini-response', async (req, res) => {
    const { jobRole, conversationHistory } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) return res.status(500).json({ error: "Gemini API Key not configured." });
    if (!jobRole || !conversationHistory) return res.status(400).json({ error: "Missing job role or conversation history." });

    const systemInstruction = {
        role: "user",
        parts: [{
            text: `You are an AI interviewer for the role '${jobRole}'. Ask technical follow-up questions or give feedback based on the candidate's answers.`
        }]
    };

    const fullConversation = [systemInstruction, ...conversationHistory];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: fullConversation,
                generationConfig: { temperature: 0.7, topP: 0.95, topK: 40 }
            })
        });

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no response generated.";
        res.json({ response: reply });
    } catch (error) {
        console.error("Gemini follow-up error:", error);
        res.status(500).json({ error: "Failed to get follow-up response." });
    }
});

// --- HTTP Server Setup ---
const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

// --- WebSocket: Deepgram AI Voice Agent ---
const wss = new WebSocketServer({ server, path: '/deepgram-ws' });

wss.on('connection', (clientWs) => {
    console.log("Client connected to Deepgram agent proxy.");

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
        console.error("Deepgram API key missing.");
        clientWs.send(JSON.stringify({ error: "Missing Deepgram API Key" }));
        clientWs.close(1011, "API Key required");
        return;
    }

    // Connect to Deepgram AI Voice Agent WebSocket
    const dgUrl = `wss://api.deepgram.com/v1/agents?encoding=opus&sample_rate=48000`;
    const dgWs = new WebSocket(dgUrl, {
        headers: { Authorization: `Token ${deepgramApiKey}` }
    });

    dgWs.on('open', () => {
        console.log("Connected to Deepgram AI Agent WebSocket.");

        // Send agent config (IMPORTANT)
        dgWs.send(JSON.stringify({
            config: {
                agent: { name: "basic-agent" }, // Use "basic-agent" or your custom one
                tts: {
                    provider: "deepgram",
                    voice: "aura-asteria-en" // You can choose other voices too
                },
                asr: {
                    model: "nova-3"
                },
                vad_events: true
            }
        }));
    });

    dgWs.on('message', (msg) => {
        // Forward Deepgram's response to the frontend
        clientWs.send(msg);
    });

    dgWs.on('close', (code, reason) => {
        console.log("Deepgram Agent WebSocket closed:", code, reason);
        clientWs.close(code, reason);
    });

    dgWs.on('error', (err) => {
        console.error("Deepgram Agent WebSocket error:", err);
        clientWs.send(JSON.stringify({ error: "Deepgram WebSocket error" }));
        clientWs.close(1011, "Deepgram error");
    });

    clientWs.on('message', (msg) => {
        // Forward client's microphone audio to Deepgram
        if (dgWs.readyState === WebSocket.OPEN) {
            dgWs.send(msg);
        }
    });

    clientWs.on('close', (code, reason) => {
        console.log("Client WebSocket closed:", code, reason);
        if (dgWs.readyState === WebSocket.OPEN) {
            dgWs.close();
        }
    });

    clientWs.on('error', (err) => {
        console.error("Client WebSocket error:", err);
        if (dgWs.readyState === WebSocket.OPEN) {
            dgWs.close();
        }
    });
});
