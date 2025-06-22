// server.js

// Load environment variables from .env file (for local development)
// Vercel handles these through its dashboard settings.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws'); // For handling Deepgram WebSocket
const fetch = require('node-fetch');     // For Gemini HTTP requests
const path = require('path');            // Node.js built-in module for path manipulation

const app = express();
// Vercel automatically sets process.env.PORT
// For local development, it will use 3000 if PORT is not set in .env
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes (for development)
app.use(express.json()); // For parsing JSON request bodies

// --- Frontend Serving ---

// Explicitly serve interviewer.html for the root route (e.g., when navigating to your Vercel URL)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'interviewer.html'));
});

// Serve other static files (like CSS, images, client-side JS) from the 'public' directory
app.use(express.static('public'));

// --- API Endpoints for Gemini ---

// Endpoint to generate the first question
app.post('/generate-first-question', async (req, res) => {
    const { jobRole } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

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

// Endpoint to get follow-up Gemini response
app.post('/get-gemini-response', async (req, res) => {
    const { jobRole, conversationHistory } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

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

// --- HTTP Server Setup ---
// Start the Express HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access your app at: http://localhost:${PORT} (for local) or your Vercel URL`);
});


// --- WebSocket Server for Deepgram Streaming (attached to the HTTP server) ---
const wss = new WebSocketServer({ server, path: '/deepgram-ws' });

wss.on('connection', function connection(ws) {
    console.log('Client connected to Deepgram WebSocket proxy.');

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
        console.error("Deepgram API Key not configured on server.");
        ws.send(JSON.stringify({ error: "Deepgram API Key is missing on server. Check your Vercel Environment Variables." }));
        ws.close(1011, "API Key missing");
        return;
    }

    // Deepgram's real-time streaming API endpoint with specified model and parameters
    const deepgramWsUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&encoding=opus&sample_rate=48000&interim_results=true&utterance_end_ms=1000`;

    // Create a new WebSocket connection to Deepgram's API
    const deepgramWs = new WebSocket(deepgramWsUrl, ['token', deepgramApiKey]);

    deepgramWs.onopen = () => {
        console.log('Connected to Deepgram API WebSocket.');
    };

    deepgramWs.onmessage = (message) => {
        // Forward Deepgram's transcription results back to the client
        ws.send(message.data);
    };

    deepgramWs.onclose = (event) => {
        console.log('Disconnected from Deepgram API WebSocket:', event.code, event.reason);
        // If Deepgram closes, also close the client's connection to our proxy
        ws.close(event.code, event.reason);
    };

    deepgramWs.onerror = (error) => {
        console.error('Deepgram API WebSocket error:', error);
        // Send an error message to the client and close the connection
        ws.send(JSON.stringify({ error: "Deepgram API WebSocket error on server. See server logs." }));
        ws.close(1011, "Deepgram API error");
    };

    ws.onmessage = (message) => {
        // Forward client's audio data (binary blob) to Deepgram
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.send(message.data);
        } else {
            console.warn("Deepgram WebSocket not open (server to Deepgram), dropping message from client.");
        }
    };

    ws.onclose = (event) => {
        console.log('Client disconnected from Deepgram WebSocket proxy:', event.code, event.reason);
        // If the client disconnects, close the connection to Deepgram
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.close();
        }
    };

    ws.onerror = (error) => {
        console.error('Client WebSocket error (from browser to server):', error);
        // If client WS has an error, ensure Deepgram WS is also closed
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.close();
        }
    };
});
