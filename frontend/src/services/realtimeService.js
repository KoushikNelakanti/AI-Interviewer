// realtimeService.js - REST API-based real-time communication with frontend optimization
class RealtimeService {
  constructor() {
    this._isConnected = false;
    this.pollingInterval = null;
    this.lastMessageId = null;
    this.messageQueue = [];
    this.isPolling = false;
    this.useMockData = false; // Flag to indicate if we're using mock data
    
    // Performance optimization
    this.debounceTimers = new Map();
    this.cache = new Map();
    this.requestQueue = [];
    
    // Event handlers
    this.onMessage = null;
    this.onStatusChange = null;
    this.onTypingIndicator = null;
    this.onConnectionChange = null;
  }

  // Initialize connection (simulated for REST API)
  async connect(serverUrl = null) {
    try {
      console.log('Connecting to realtime service:', serverUrl);
      
      // Always use mock data mode for frontend-only operation
      console.log('Using mock data mode for frontend-only operation');
      this.serverUrl = 'mock://localhost'; // Use mock URL to prevent actual network requests
      this.useMockData = true; // Always enable mock data mode
      
      // Simulate a health check
      console.log('Mock mode enabled, skipping actual health check');
      
      this._isConnected = true;
      this.emitStatusChange('connected');
      this.emitConnectionChange(true);
      
      // Start polling for updates
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.handleConnectionError();
      return false;
    }
  }

  // Disconnect from server
  disconnect() {
    console.log('Disconnecting from realtime service');
    this.stopPolling();
    this._isConnected = false;
    this.emitStatusChange('disconnected');
    this.emitConnectionChange(false);
  }

  // Start polling for real-time updates
  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      await this.pollForUpdates();
    }, 1000); // Poll every second for updates
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  // Poll for updates from server
  async pollForUpdates() {
    try {
      // Simulate API call to get updates
      const updates = await this.fetchUpdates();
      
      if (updates && updates.length > 0) {
        updates.forEach(update => {
          this.handleUpdate(update);
        });
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Don't stop polling on error, just log it
    }
  }

  // Fetch updates from server (simulated)
  async fetchUpdates() {
    // If using mock data, return simulated updates directly
    if (this.useMockData) {
      return this.simulateUpdates();
    }
    
    try {
      // In a real implementation, this would be an actual API call
      const response = await fetch(`${this.serverUrl}/updates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return [];
    } catch (error) {
      console.log('Error fetching updates, using simulated data:', error.message);
      // Fallback to simulated updates on error
      return this.simulateUpdates();
    }
  }
  
  // Simulate updates for demo purposes
  simulateUpdates() {
    // Only return updates occasionally to simulate real-time events
    if (Math.random() < 0.3) { // 30% chance of getting an update
      const updateTypes = [
        'interview_update',
        'chat',
        'audio_chunk'
      ];
      
      const updateType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
      
      switch (updateType) {
        case 'interview_update':
          return [{
            type: 'interview_update',
            status: 'active',
            content: 'Interview status updated',
            timestamp: Date.now(),
            id: `update_${Date.now()}`
          }];
          
        case 'chat':
          return [{
            type: 'chat',
            message: 'This is a simulated message from the mock API',
            sender: 'interviewer',
            timestamp: Date.now()
          }];
          
        case 'audio_chunk':
          return [{
            type: 'audio_chunk',
            data: 'simulated-audio-data',
            timestamp: Date.now()
          }];
          
        default:
          return [];
      }
    }
    
    return []; // No updates most of the time
  }

  // Handle incoming updates
  handleUpdate(update) {
    try {
      switch (update.type) {
        case 'interview_update':
          this.handleInterviewUpdate(update);
          break;
        case 'chat':
          this.handleChatMessage(update);
          break;
        case 'audio_chunk':
          this.handleAudioChunk(update);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(update);
          break;
        default:
          console.log('Unknown update type:', update.type);
      }
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  // Send message via REST API
  async sendMessage(message, type = 'chat') {
    try {
      const messageData = {
        type,
        content: message,
        timestamp: Date.now(),
        id: this.generateMessageId()
      };

      // Add to local queue for immediate UI feedback
      this.messageQueue.push(messageData);
      
      // Emit message locally for instant feedback
      if (this.onMessage) {
        this.onMessage(messageData);
      }

      // Send to server via REST API
      const success = await this.sendToServer(messageData);
      
      if (!success) {
        // If server send fails, keep in queue for retry
        console.warn('Failed to send message to server, will retry');
      } else {
        // Remove from queue on successful send
        this.messageQueue = this.messageQueue.filter(m => m.id !== messageData.id);
      }

      return success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Send message to server via REST API
  async sendToServer(messageData) {
    // In mock mode, always return success without making actual API calls
    if (this.useMockData) {
      console.log('Mock mode: Simulating successful message send to server', messageData);
      return true;
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(messageData)
      });

      return response.ok;
    } catch (error) {
      console.error('Server send error:', error);
      return false;
    }
  }

  // Send typing indicator
  async sendTypingIndicator(isTyping) {
    try {
      const indicatorData = {
        isTyping,
        timestamp: Date.now()
      };

      // Emit locally for immediate feedback
      if (this.onTypingIndicator) {
        this.onTypingIndicator(indicatorData);
      }

      // In mock mode, skip actual API call
      if (this.useMockData) {
        console.log('Mock mode: Simulating typing indicator send', indicatorData);
        return true;
      }

      // Send to server
      await fetch(`${this.serverUrl}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(indicatorData)
      });

      return true;
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      return false;
    }
  }

  // Join interview room
  async joinInterview(interviewId, userId) {
    try {
      // If using mock data, simulate successful join
      if (this.useMockData) {
        this.currentInterviewId = interviewId;
        this.currentUserId = userId;
        console.log(`Joined interview ${interviewId} (mock mode)`);
        return true;
      }
      
      const joinData = {
        interviewId,
        userId,
        timestamp: Date.now()
      };

      // Send join request to server
      const response = await fetch(`${this.serverUrl}/interviews/${interviewId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(joinData)
      });

      if (response.ok) {
        this.currentInterviewId = interviewId;
        this.currentUserId = userId;
        console.log(`Joined interview ${interviewId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error joining interview:', error);
      
      // If API call fails, fall back to mock mode
      if (!this.useMockData) {
        console.log('Falling back to mock mode due to join error');
        this.useMockData = true;
        this.currentInterviewId = interviewId;
        this.currentUserId = userId;
        return true;
      }
      
      return false;
    }
  }

  // Leave interview room
  async leaveInterview(interviewId) {
    try {
      // If using mock data, simulate successful leave
      if (this.useMockData) {
        this.currentInterviewId = null;
        this.currentUserId = null;
        console.log(`Left interview ${interviewId} (mock mode)`);
        return true;
      }
      
      const leaveData = {
        interviewId,
        timestamp: Date.now()
      };

      // Send leave request to server
      const response = await fetch(`${this.serverUrl}/interviews/${interviewId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(leaveData)
      });

      if (response.ok) {
        this.currentInterviewId = null;
        this.currentUserId = null;
        console.log(`Left interview ${interviewId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error leaving interview:', error);
      
      // Even if there's an error, clean up the local state
      this.currentInterviewId = null;
      this.currentUserId = null;
      return true; // Return true to allow cleanup to continue
    }
  }

  // Send audio chunk for processing
  async sendAudioChunk(audioData, isFinal = false) {
    try {
      const audioChunkData = {
        audioData,
        isFinal,
        timestamp: Date.now()
      };

      // For real-time processing, we'll process locally
      // In production, you might want to send to server for analysis
      if (isFinal) {
        // Process final audio chunk
        this.processAudioChunk(audioChunkData);
      }

      return true;
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      return false;
    }
  }

  // Process audio chunk locally for low latency
  processAudioChunk(audioChunkData) {
    // This would integrate with your audio processing service
    // For now, just emit the event
    if (this.onMessage) {
      this.onMessage({
        type: 'audio_chunk',
        ...audioChunkData
      });
    }
  }

  // Handle connection errors
  handleConnectionError() {
    this._isConnected = false;
    this.emitStatusChange('error');
    this.emitConnectionChange(false);
    
    // Stop polling
    this.stopPolling();
    
    // Retry connection after delay
    setTimeout(() => {
      this.connect(this.serverUrl);
    }, 5000);
  }

  // Clean up resources
  cleanUp() {
    this.stopPolling();
    this._isConnected = false;
    this.emitStatusChange('disconnected');
    this.emitConnectionChange(false);
    
    // Clear message queue
    this.messageQueue = [];
    
    // Clear cache
    this.cache.clear();
  }

  // Event emitters
  emitStatusChange(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  emitConnectionChange(connected) {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  // Handle interview updates
  handleInterviewUpdate(update) {
    if (this.onMessage) {
      this.onMessage({
        type: 'interview_update',
        ...update
      });
    }
  }

  // Handle chat messages
  handleChatMessage(update) {
    if (this.onMessage) {
      this.onMessage({
        type: 'chat_message',
        ...update
      });
    }
  }

  // Handle audio chunks
  handleAudioChunk(update) {
    if (this.onMessage) {
      this.onMessage({
        type: 'audio_chunk',
        ...update
      });
    }
  }

  // Handle typing indicators
  handleTypingIndicator(update) {
    if (this.onTypingIndicator) {
      this.onTypingIndicator(update);
    }
  }

  // Set event handlers
  setMessageHandler(handler) {
    this.onMessage = handler;
  }

  setStatusHandler(handler) {
    this.onStatusChange = handler;
  }

  setTypingIndicatorHandler(handler) {
    this.onTypingIndicator = handler;
  }

  setConnectionChangeHandler(handler) {
    this.onConnectionChange = handler;
  }

  // Utility methods
  generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getAuthToken() {
    // In a real app, this would get the token from storage/auth service
    return localStorage.getItem('authToken') || 'demo-token';
  }

  isConnected() {
    return this._isConnected;
  }

  getConnectionStatus() {
    return {
      connected: this._isConnected,
      isPolling: this.isPolling,
      messageQueueLength: this.messageQueue.length
    };
  }

  // Performance optimization methods
  debounce(key, callback, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  // Cache management
  setCache(key, value, ttl = 60000) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  // Batch requests for better performance
  addToRequestQueue(request) {
    this.requestQueue.push(request);
    
    // Process queue if it gets too long
    if (this.requestQueue.length >= 10) {
      this.processRequestQueue();
    }
  }

  async processRequestQueue() {
    if (this.requestQueue.length === 0) return;
    
    const batch = this.requestQueue.splice(0, 10);
    
    try {
      // Process batch requests
      const promises = batch.map(request => this.processRequest(request));
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  async processRequest(request) {
    // Implement request processing logic
    console.log('Processing request:', request);
  }
}

// Export singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;

// Export class for testing or multiple instances
export { RealtimeService };
