// Enhanced geminiService.js with streaming and optimized prompts
import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

// Initialize Gemini with API key from environment
export function initializeGemini() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 150, // Shorter responses for faster interaction
      }
    });
  }
}

export async function getGeminiResponse(userText, conversationHistory = [], role = 'Software Engineer') {
  try {
    if (!model) {
      initializeGemini();
      if (!model) {
        throw new Error('Gemini API key not set');
      }
    }

    // Optimize conversation history for faster processing
    const recentHistory = conversationHistory.slice(-6).map(m => 
      `${m.sender === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`
    ).join('\n');

    // Enhanced prompt for better interview flow
    const prompt = `You are Sarah Chen, a senior ${role} interviewer. Keep responses concise (max 2 sentences) and engaging. Ask one clear question at a time. Be conversational but professional.

Interview Context: ${role} position
${recentHistory ? `Recent conversation:\n${recentHistory}` : ''}

Candidate: ${userText}

Interviewer (Sarah Chen):`;

    const result = await model.generateContent(prompt);
    const response = result?.response?.text?.() || '';
    
    // Clean up response for better readability
    return response.trim().replace(/^Interviewer \(Sarah Chen\):\s*/i, '');
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'I apologize, but I need a moment to process that. Could you please repeat your question?';
  }
}

// Streaming response for real-time interaction
export async function* getGeminiStreamResponse(userText, conversationHistory = [], role = 'Software Engineer') {
  try {
    if (!model) {
      initializeGemini();
      if (!model) {
        throw new Error('Gemini API key not set');
      }
    }

    const recentHistory = conversationHistory.slice(-6).map(m => 
      `${m.sender === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`
    ).join('\n');

    const prompt = `You are Sarah Chen, a senior ${role} interviewer. Keep responses concise (max 2 sentences) and engaging. Ask one clear question at a time. Be conversational but professional.

Interview Context: ${role} position
${recentHistory ? `Recent conversation:\n${recentHistory}` : ''}

Candidate: ${userText}

Interviewer (Sarah Chen):`;

    const result = await model.generateContentStream(prompt);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      yield chunkText;
    }
    
    return fullResponse.trim().replace(/^Interviewer \(Sarah Chen\):\s*/i, '');
    
  } catch (error) {
    console.error('Gemini streaming error:', error);
    yield 'I apologize, but I need a moment to process that. Could you please repeat your question?';
  }
}

// Quick response for common interview scenarios
export async function getQuickResponse(scenario, role = 'Software Engineer') {
  try {
    if (!model) {
      initializeGemini();
      if (!model) {
        throw new Error('Gemini API key not set');
      }
    }

    const quickPrompt = `You are Sarah Chen, a ${role} interviewer. Give a very brief (1 sentence) response for this scenario: ${scenario}`;

    const result = await model.generateContent(quickPrompt);
    return result?.response?.text?.() || '';
    
  } catch (error) {
    console.error('Quick response error:', error);
    return '';
  }
}

// Check if Gemini is properly initialized
export function isGeminiReady() {
  return model !== null;
}

// Get model information
export function getModelInfo() {
  return {
    name: 'gemini-1.5-flash',
    ready: isGeminiReady(),
    streaming: true
  };
}