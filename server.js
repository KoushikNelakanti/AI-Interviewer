// server.js (ES Module format)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'cross-fetch';
import { createClient, AgentEvents } from '@deepgram/sdk';
import { writeFile, appendFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public'))); // Serve frontend if needed

// Deepgram setup
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.get('/', (req, res) => {
  res.send('🧠 Deepgram AI Interviewer is running. Use /start-agent to begin.');
});

app.get('/start-agent', async (req, res) => {
  try {
    startAgent();
    res.json({ status: 'Deepgram Voice Agent started successfully.' });
  } catch (error) {
    console.error('Failed to start Deepgram agent:', error);
    res.status(500).json({ error: 'Failed to start agent.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Deepgram Agent function
const startAgent = async () => {
  let audioBuffer = Buffer.alloc(0);
  let fileIndex = 0;
  const url = "https://dpgr.am/spacewalk.wav"; // Sample audio or replace with your source

  const connection = deepgram.agent();

  connection.on(AgentEvents.Welcome, () => {
    console.log('👋 Welcome to Deepgram Voice Agent');

    connection.configure({
      audio: {
        input: {
          encoding: "linear16",
          sample_rate: 24000,
        },
        output: {
          encoding: "linear16",
          sample_rate: 16000,
          container: "wav",
        },
      },
      agent: {
        language: "en",
        listen: {
          provider: {
            type: "deepgram",
            model: "nova-3",
          },
        },
        think: {
          provider: {
            type: "open_ai",
            model: "gpt-4o-mini",
          },
          prompt: "You are a professional and friendly AI interviewer. Ask relevant questions and give feedback.",
        },
        speak: {
          provider: {
            type: "deepgram",
            model: "aura-2-thalia-en",
          },
        },
        greeting: "Hi there! I'm your AI interviewer. Let's get started!",
      },
    });

    setInterval(() => connection.keepAlive(), 5000);

    fetch(url)
      .then((r) => r.body)
      .then((res) => {
        res.on("readable", () => {
          const chunk = res.read();
          if (chunk) {
            connection.send(chunk);
            console.log("📡 Sending audio chunk");
          }
        });
      });
  });

  connection.on(AgentEvents.Open, () => {
    console.log("🔗 Connection to Deepgram opened");
  });

  connection.on(AgentEvents.ConversationText, async (data) => {
    await appendFile(join(__dirname, 'chatlog.txt'), JSON.stringify(data) + "\n");
    console.log("💬 Logged conversation text");
  });

  connection.on(AgentEvents.Audio, (data) => {
    audioBuffer = Buffer.concat([audioBuffer, Buffer.from(data)]);
  });

  connection.on(AgentEvents.AgentAudioDone, async () => {
    const filePath = join(__dirname, `output-${fileIndex}.wav`);
    await writeFile(filePath, audioBuffer);
    console.log(`✅ Audio saved to ${filePath}`);
    audioBuffer = Buffer.alloc(0);
    fileIndex++;
  });

  connection.on(AgentEvents.Close, () => {
    console.log("❌ Connection to Deepgram closed");
  });

  connection.on(AgentEvents.Error, (err) => {
    console.error("❌ Deepgram Agent Error:", err);
  });

  connection.on(AgentEvents.Unhandled, (data) => {
    console.log("🔍 Unhandled event:");
    console.dir(data, { depth: null });
  });

  connection.on(AgentEvents.UserStartedSpeaking, () => {
    if (audioBuffer.length > 0) {
      console.log("⚠️ User interrupted agent");
      audioBuffer = Buffer.alloc(0);
    }
  });

  connection.on(AgentEvents.Metadata, (meta) => {
    console.log("📊 Metadata received:", meta);
  });
};
