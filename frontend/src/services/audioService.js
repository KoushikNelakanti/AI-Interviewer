// Enhanced audioService.js with real-time streaming
import { Deepgram } from '@deepgram/sdk';

let deepgram = null;
let liveTranscription = null;
let audioContext = null;
let mediaStreamSource = null;
let analyser = null;
let isListening = false;
let speaking = false;
let lastSpoke = 0;

const THRESHOLD = 0.01;
const SILENCE_MS = 1000; // Reduced silence detection for faster response

let onTranscript = null;
let onStatusChange = null;
let onSpeakingChange = null;
let onPartialTranscript = null;

export function setCallbacks(transcriptCallback, statusCallback, speakingCallback, partialCallback = null) {
  onTranscript = transcriptCallback;
  onStatusChange = statusCallback;
  onSpeakingChange = speakingCallback;
  onPartialTranscript = partialCallback;
}

export function updateStatus(status) {
  if (onStatusChange) {
    onStatusChange(status);
  }
}

export async function startVoiceRecognition() {
  try {
    updateStatus('Initializing...');
    
    // Initialize Deepgram
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('Deepgram API key not found');
    }
    
    deepgram = new Deepgram(apiKey);
    
    // Get microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1
      } 
    });
    
    // Set up audio context for voice activity detection
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    mediaStreamSource.connect(analyser);
    
    // Start real-time transcription
    await startLiveTranscription(stream);
    
    // Start voice activity monitoring
    monitorAudio();
    
    updateStatus('Listening...');
    return true;
    
  } catch (error) {
    console.error('Voice recognition error:', error);
    updateStatus(`Error: ${error.message}`);
    return false;
  }
}

async function startLiveTranscription(stream) {
  try {
    // Create live transcription with optimized settings
    liveTranscription = deepgram.transcription.live({
      model: 'nova-2',
      smart_format: true,
      punctuate: true,
      diarize: false,
      interim_results: true,
      endpointing: 200, // Faster endpointing for lower latency
      vad_events: true,
      language: 'en-US',
      encoding: 'linear16',
      channels: 1,
      sample_rate: 16000
    });
    
    // Handle transcription events
    liveTranscription.addListener('transcriptReceived', (transcription) => {
      const transcript = transcription?.channel?.alternatives?.[0]?.transcript;
      const isFinal = transcription?.isFinal;
      
      if (transcript && transcript.trim()) {
        if (isFinal) {
          // Final transcript
          if (onTranscript) {
            onTranscript(transcript.trim());
          }
          updateStatus('Listening...');
        } else {
          // Partial transcript for real-time feedback
          if (onPartialTranscript) {
            onPartialTranscript(transcript.trim());
          }
        }
      }
    });
    
    // Handle connection events
    liveTranscription.addListener('open', () => {
      updateStatus('Connected to Deepgram...');
    });
    
    liveTranscription.addListener('error', (error) => {
      console.error('Deepgram error:', error);
      updateStatus(`Error: ${error.message}`);
    });
    
    liveTranscription.addListener('close', () => {
      updateStatus('Connection closed');
    });
    
    // Start streaming audio
    const audioTrack = stream.getAudioTracks()[0];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && liveTranscription && liveTranscription.getReadyState() === 1) {
        try {
          // Convert audio data to proper format for Deepgram
          const arrayBuffer = await event.data.arrayBuffer();
          liveTranscription.send(arrayBuffer);
        } catch (e) {
          console.error('Error sending audio data:', e);
        }
      }
    };
    
    // Start recording with smaller chunks for lower latency
    mediaRecorder.start(100); // 100ms chunks for faster processing
    
    // Store media recorder reference for cleanup
    liveTranscription.mediaRecorder = mediaRecorder;
    
  } catch (error) {
    console.error('Live transcription error:', error);
    updateStatus(`Transcription error: ${error.message}`);
  }
}

function monitorAudio() {
  if (!analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const checkAudio = () => {
    if (!analyser) return;
    
    analyser.getByteTimeDomainData(dataArray);
    
    // Calculate RMS volume for better voice detection
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = (dataArray[i] - 128) / 128;
      sum += amplitude * amplitude;
    }
    const volume = Math.sqrt(sum / bufferLength);
    
    handleVoiceActivity(volume);
    
    requestAnimationFrame(checkAudio);
  };
  
  checkAudio();
}

function handleVoiceActivity(volume) {
  const now = Date.now();
  
  if (volume > THRESHOLD) {
    lastSpoke = now;
    
    if (!speaking) {
      speaking = true;
      if (onSpeakingChange) {
        onSpeakingChange(true);
      }
      updateStatus('🗣️ Speaking...');
    }
  }
  
  if (speaking && now - lastSpoke > SILENCE_MS) {
    speaking = false;
    if (onSpeakingChange) {
      onSpeakingChange(false);
    }
    
    // Send silence indicator to Deepgram for faster endpointing
    if (liveTranscription && liveTranscription.getReadyState() === 1) {
      try {
        liveTranscription.finish();
      } catch (e) {
        console.error('Error finishing transcription:', e);
      }
    }
  }
}

export function stopVoiceRecognition() {
  updateStatus('Stopping...');
  
  // Stop live transcription
  if (liveTranscription) {
    try {
      if (liveTranscription.mediaRecorder) {
        liveTranscription.mediaRecorder.stop();
      }
      liveTranscription.finish();
      liveTranscription = null;
    } catch (e) {
      console.error('Error stopping transcription:', e);
    }
  }
  
  // Stop media stream tracks
  if (mediaStreamSource && mediaStreamSource.mediaStream) {
    mediaStreamSource.mediaStream.getTracks().forEach(track => track.stop());
  }
  
  // Close audio context
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  // Reset state
  speaking = false;
  isListening = false;
  analyser = null;
  mediaStreamSource = null;
  
  updateStatus('Idle');
}

// Utility function to get current audio level for UI feedback
export function getAudioLevel() {
  if (!analyser) return 0;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    const amplitude = (dataArray[i] - 128) / 128;
    sum += amplitude * amplitude;
  }
  
  return Math.sqrt(sum / bufferLength);
}

// Check if voice recognition is active
export function isVoiceRecognitionActive() {
  return isListening && liveTranscription !== null;
}