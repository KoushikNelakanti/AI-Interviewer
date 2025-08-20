// interviewService.jsx - Orchestrates all interview services for low-latency processing using REST APIs
import realtimeService from './realtimeService.js';
import * as geminiService from './geminiService.js';
import * as audioService from './audioService.js';

class InterviewService {
  constructor() {
    this.isInitialized = false;
    this.currentInterviewId = null;
    this.currentUserId = null;
    this.isProcessing = false;
    
    // Performance metrics
    this.responseTimes = [];
    this.audioLatency = [];
    
    // Frontend optimization
    this.messageCache = new Map();
    this.responseCache = new Map();
    this.debounceTimers = new Map();
    
    // Callbacks
    this.onInterviewUpdate = null;
    this.onPerformanceMetrics = null;
    this.onError = null;
  }

  // Initialize all services
  async initialize(interviewId, userId, options = {}) {
    try {
      this.currentInterviewId = interviewId;
      this.currentUserId = userId;
      
      // Initialize Gemini
      geminiService.initializeGemini();
      
      // Initialize real-time service with mock mode for frontend-only operation
      console.log('Initializing interview service in frontend-only mode');
      const serverUrl = 'mock://localhost'; // Use mock URL to prevent actual network requests
      await realtimeService.connect(serverUrl);
      
      // Set up real-time service handlers
      realtimeService.setMessageHandler(this.handleRealtimeMessage.bind(this));
      realtimeService.setStatusHandler(this.handleRealtimeStatus.bind(this));
      realtimeService.setConnectionChangeHandler(this.handleConnectionChange.bind(this));
      
      // Join interview room
      await this.waitForConnection();
      await realtimeService.joinInterview(interviewId, userId);
      
      // Initialize audio service with enhanced callbacks
      audioService.setCallbacks(
        this.handleTranscript.bind(this),
        this.handleVoiceStatusChange.bind(this),
        this.handleSpeakingChange.bind(this),
        this.handlePartialTranscript.bind(this)
      );
      
      this.isInitialized = true;
      console.log('Interview service initialized successfully');
      
      return true;
      
    } catch (error) {
      console.error('Interview service initialization error:', error);
      this.handleError(error);
      return false;
    }
  }

  // Wait for connection (simplified for REST API)
  async waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (realtimeService.isConnected()) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Connection timeout'));
          return;
        }
        
        setTimeout(checkConnection, 100);
      };
      
      checkConnection();
    });
  }

  // Handle real-time messages from REST API polling
  handleRealtimeMessage(data) {
    try {
      switch (data.type) {
        case 'interview_update':
          this.handleInterviewUpdate(data);
          break;
        case 'chat':
          this.handleChatMessage(data);
          break;
        case 'audio_chunk':
          this.handleAudioChunk(data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Handle real-time status changes
  handleRealtimeStatus(status) {
    console.log('Realtime status:', status);
    
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'status_change',
        status,
        timestamp: Date.now()
      });
    }
  }

  // Handle connection changes
  handleConnectionChange(connected) {
    console.log('Connection changed:', connected);
    
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'connection_change',
        connected,
        timestamp: Date.now()
      });
    }
    
    // If connection is lost, report an error
    if (!connected) {
      this.handleError({
        message: 'Connection to interview service lost',
        type: 'connection',
        details: 'The connection to the interview service has been lost. Using local mock data instead.'
      });
    }
  }

  // Handle interview updates
  handleInterviewUpdate(data) {
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate(data);
    }
  }

  // Handle chat messages
  handleChatMessage(data) {
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'chat_message',
        ...data,
        timestamp: Date.now()
      });
    }
  }

  // Handle audio chunks
  handleAudioChunk(data) {
    // Process audio chunks for real-time analysis
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'audio_chunk',
        ...data,
        timestamp: Date.now()
      });
    }
  }

  // Handle transcript from audio service with frontend optimization
  async handleTranscript(text) {
    const startTime = Date.now();
    
    try {
      // Check cache first for similar responses
      const cacheKey = this.generateCacheKey(text);
      const cachedResponse = this.responseCache.get(cacheKey);
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < 300000) { // 5 min cache
        console.log('Using cached response for:', text);
        this.handleCachedResponse(cachedResponse);
        return cachedResponse.response;
      }
      
      // Send transcript via REST API
      await realtimeService.sendMessage(text, 'transcript');
      
      // Get Gemini response with streaming
      const response = await this.getGeminiResponse(text);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      
      // Cache the response
      this.responseCache.set(cacheKey, {
        response,
        responseTime,
        timestamp: Date.now()
      });
      
      // Send response via REST API
      await realtimeService.sendMessage(response, 'interviewer_response');
      
      // Update interview state
      if (this.onInterviewUpdate) {
        this.onInterviewUpdate({
          type: 'interviewer_response',
          text: response,
          responseTime,
          timestamp: Date.now()
        });
      }
      
      return response;
      
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  // Handle cached response
  handleCachedResponse(cachedData) {
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'interviewer_response',
        text: cachedData.response,
        responseTime: cachedData.responseTime,
        timestamp: Date.now(),
        cached: true
      });
    }
  }

  // Generate cache key for responses
  generateCacheKey(text) {
    // Simple hash for demo - in production use a proper hashing algorithm
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
  }

  // Handle partial transcript for real-time feedback
  handlePartialTranscript(text) {
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'partial_transcript',
        text,
        timestamp: Date.now()
      });
    }
  }

  // Handle voice status changes
  handleVoiceStatusChange(status) {
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'voice_status',
        status,
        timestamp: Date.now()
      });
    }
  }

  // Handle speaking changes
  handleSpeakingChange(isSpeaking) {
    if (this.onInterviewUpdate) {
      this.onInterviewUpdate({
        type: 'speaking_change',
        isSpeaking,
        timestamp: Date.now()
      });
    }
  }

  // Get Gemini response with performance tracking and frontend optimization
  async getGeminiResponse(userText, useStreaming = false) {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (useStreaming) {
        // Use streaming for real-time interaction
        const stream = geminiService.getGeminiStreamResponse(userText, [], this.getCurrentRole());
        response = '';
        
        for await (const chunk of stream) {
          response += chunk;
          
          // Send partial response for real-time display
          if (this.onInterviewUpdate) {
            this.onInterviewUpdate({
              type: 'partial_response',
              text: response,
              timestamp: Date.now()
            });
          }
        }
      } else {
        // Use regular response for faster processing
        response = await geminiService.getGeminiResponse(userText, [], this.getCurrentRole());
      }
      
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      
      return response;
      
    } catch (error) {
      this.handleError(error);
      return 'I apologize, but I need a moment to process that. Could you please repeat your question?';
    }
  }

  // Start voice recognition
  async startVoiceRecognition() {
    try {
      const success = await audioService.startVoiceRecognition();
      
      if (success) {
        // Send status update via REST API
        await realtimeService.sendMessage('Voice recognition started', 'status');
      }
      
      return success;
      
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  // Stop voice recognition
  stopVoiceRecognition() {
    try {
      audioService.stopVoiceRecognition();
      realtimeService.sendMessage('Voice recognition stopped', 'status');
    } catch (error) {
      this.handleError(error);
    }
  }

  // Send text message with debouncing for better performance
  sendTextMessage(text) {
    const debounceKey = 'text_message';
    
    this.debounce(debounceKey, async () => {
      try {
        // Send via REST API
        await realtimeService.sendMessage(text, 'text');
        
        // Get response
        this.getGeminiResponse(text);
        
      } catch (error) {
        this.handleError(error);
      }
    }, 300); // 300ms debounce
  }

  // Send typing indicator
  sendTypingIndicator(isTyping) {
    try {
      realtimeService.sendTypingIndicator(isTyping);
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  // Debounce utility
  debounce(key, callback, delay) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  // Record response time for performance metrics
  recordResponseTime(responseTime) {
    this.responseTimes.push(responseTime);
    
    // Keep only last 50 responses
    if (this.responseTimes.length > 50) {
      this.responseTimes.shift();
    }
    
    // Calculate and emit performance metrics
    this.emitPerformanceMetrics();
  }

  // Record audio latency
  recordAudioLatency(latency) {
    this.audioLatency.push(latency);
    
    // Keep only last 100 measurements
    if (this.audioLatency.length > 100) {
      this.audioLatency.shift();
    }
    
    // Calculate and emit performance metrics
    this.emitPerformanceMetrics();
  }

  // Emit performance metrics
  emitPerformanceMetrics() {
    if (!this.onPerformanceMetrics) return;
    
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    const avgAudioLatency = this.audioLatency.length > 0 
      ? this.audioLatency.reduce((a, b) => a + b, 0) / this.audioLatency.length 
      : 0;
    
    this.onPerformanceMetrics({
      avgResponseTime: Math.round(avgResponseTime),
      avgAudioLatency: Math.round(avgAudioLatency),
      totalResponses: this.responseTimes.length,
      totalAudioMeasurements: this.audioLatency.length,
      cacheHitRate: this.calculateCacheHitRate(),
      timestamp: Date.now()
    });
  }

  // Calculate cache hit rate
  calculateCacheHitRate() {
    const totalRequests = this.responseTimes.length;
    const cacheHits = Array.from(this.responseCache.values()).filter(
      entry => Date.now() - entry.timestamp < 300000
    ).length;
    
    return totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
  }

  // Get current role from URL params
  getCurrentRole() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('role') || 'Software Engineer';
  }

  // Handle errors
  handleError(error) {
    console.error('Interview service error:', error);
    
    // Create a structured error object
    const errorObj = {
      message: error.message || 'An error occurred in the interview service',
      type: error.type || 'service',
      timestamp: Date.now(),
      details: error.details || null
    };
    
    if (this.onError) {
      this.onError(errorObj);
    }
    
    // Send error via REST API
    realtimeService.sendMessage(`Error: ${error.message || 'Unknown error'}`, 'error');
  }

  // Set callbacks
  setInterviewUpdateHandler(handler) {
    this.onInterviewUpdate = handler;
  }

  setPerformanceMetricsHandler(handler) {
    this.onPerformanceMetrics = handler;
  }

  setErrorHandler(handler) {
    this.onError = handler;
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.isInitialized,
      realtimeConnected: realtimeService.isConnected(),
      geminiReady: geminiService.isGeminiReady(),
      currentInterviewId: this.currentInterviewId,
      currentUserId: this.currentUserId,
      isProcessing: this.isProcessing,
      cacheSize: this.responseCache.size,
      messageCacheSize: this.messageCache.size
    };
  }

  // Cleanup
  cleanup() {
    try {
      // Stop voice recognition
      audioService.stopVoiceRecognition();
      
      // Leave interview room
      if (this.currentInterviewId) {
        realtimeService.leaveInterview(this.currentInterviewId);
      }
      
      // Disconnect real-time service
      realtimeService.disconnect();
      
      // Clear caches
      this.responseCache.clear();
      this.messageCache.clear();
      
      // Clear debounce timers
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();
      
      // Reset state
      this.isInitialized = false;
      this.currentInterviewId = null;
      this.currentUserId = null;
      this.isProcessing = false;
      
      console.log('Interview service cleaned up');
      
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Optimize performance by preloading common responses
  async preloadCommonResponses() {
    const commonQuestions = [
      'Tell me about yourself',
      'What are your strengths?',
      'Where do you see yourself in 5 years?',
      'Why should we hire you?'
    ];

    try {
      for (const question of commonQuestions) {
        const response = await this.getGeminiResponse(question);
        const cacheKey = this.generateCacheKey(question);
        this.responseCache.set(cacheKey, {
          response,
          timestamp: Date.now(),
          preloaded: true
        });
      }
      console.log('Preloaded common responses');
    } catch (error) {
      console.error('Preload error:', error);
    }
  }
}

// Export singleton instance
const interviewService = new InterviewService();
export default interviewService;

// Export class for testing or multiple instances
export { InterviewService };


// Initialize the interview service
export async function initializeInterview(interviewId, interviewType, duration, role, onUpdate, onError) {

    console.log('Initializing interview service:', { interviewId, interviewType, duration, role });
    
    try {
      this.interviewId = interviewId;
      this.interviewType = interviewType;
      this.duration = duration;
      this.role = role;
      this.onUpdate = onUpdate;
      this.onError = onError;
      
      // Initialize Gemini service
      await geminiService.initializeGemini();
      console.log('Gemini service initialized');
      
      // Initialize realtime service
      const realtimeConnected = await realtimeService.connect();
      console.log('Realtime service connection result:', realtimeConnected);
      
      if (!realtimeConnected) {
        throw new Error('Failed to connect to realtime service. Please check your internet connection and try again.');
      }
      
      // Join the interview room
      await realtimeService.joinRoom(interviewId, {
        type: interviewType,
        duration,
        role
      });
      console.log('Joined interview room:', interviewId);
      
      // Set up message handler
      realtimeService.onMessage(this.handleRealtimeMessage.bind(this));
      
      // Set up connection status handler
      realtimeService.onConnectionStatusChange((status) => {
        this.connectionStatus = status;
        this.onUpdate({
          type: 'connectionStatus',
          status
        });
      });
      
      // Initialize audio service
      await audioService.initialize({
        onTranscript: (transcript) => {
          this.onUpdate({
            type: 'transcript',
            transcript
          });
        },
        onPartialTranscript: (partialTranscript) => {
          this.onUpdate({
            type: 'partialTranscript',
            partialTranscript
          });
        },
        onVoiceStatusChange: (status) => {
          this.onUpdate({
            type: 'voiceStatus',
            status
          });
        },
        onAudioLevel: (level) => {
          this.onUpdate({
            type: 'audioLevel',
            level
          });
        }
      });
      console.log('Audio service initialized');
      
      // Preload common responses
      this.preloadCommonResponses();
      
      return { success: true };
    } catch (error) {
      console.error('Error initializing interview service:', error);
      
      // Call the onError callback if provided
      if (this.onError) {
        this.onError(error);
      }
      
      throw error;
    }
  }

