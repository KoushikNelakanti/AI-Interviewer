// apiService.js - REST API service for interview platform
class ApiService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'https://api.interview-platform.com';
    this.authToken = localStorage.getItem('authToken') || null;
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Set authentication token
  setAuthToken(token) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  // Get authentication token
  getAuthToken() {
    return this.authToken;
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  // Make HTTP request with error handling and retries
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Interview-specific API methods
  async createInterview(interviewData) {
    return this.post('/interviews', interviewData);
  }

  async getInterview(interviewId) {
    return this.get(`/interviews/${interviewId}`);
  }

  async updateInterview(interviewId, updateData) {
    return this.put(`/interviews/${interviewId}`, updateData);
  }

  async deleteInterview(interviewId) {
    return this.delete(`/interviews/${interviewId}`);
  }

  async joinInterview(interviewId, userId) {
    return this.post(`/interviews/${interviewId}/join`, { userId });
  }

  async leaveInterview(interviewId) {
    return this.post(`/interviews/${interviewId}/leave`);
  }

  // Message API methods
  async sendMessage(interviewId, messageData) {
    return this.post(`/interviews/${interviewId}/messages`, messageData);
  }

  async getMessages(interviewId, limit = 50, offset = 0) {
    return this.get(`/interviews/${interviewId}/messages`, { limit, offset });
  }

  async sendTypingIndicator(interviewId, isTyping) {
    return this.post(`/interviews/${interviewId}/typing`, { isTyping });
  }

  // Audio API methods
  async uploadAudio(interviewId, audioData) {
    const formData = new FormData();
    formData.append('audio', audioData);
    formData.append('interviewId', interviewId);
    
    return this.request(`/interviews/${interviewId}/audio`, {
      method: 'POST',
      headers: {
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: formData
    });
  }

  async getAudioTranscription(interviewId, audioId) {
    return this.get(`/interviews/${interviewId}/audio/${audioId}/transcription`);
  }

  // User API methods
  async getUserProfile() {
    return this.get('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.put('/user/profile', profileData);
  }

  async getUserInterviews(limit = 20, offset = 0) {
    return this.get('/user/interviews', { limit, offset });
  }

  // Analytics API methods
  async getInterviewAnalytics(interviewId) {
    return this.get(`/interviews/${interviewId}/analytics`);
  }

  async getUserAnalytics() {
    return this.get('/user/analytics');
  }

  // Health check
  async healthCheck() {
    try {
      return await this.get('/health');
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Batch operations for better performance
  async batchRequest(requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
      return [];
    }

    try {
      const response = await this.post('/batch', { requests });
      return response.results;
    } catch (error) {
      console.error('Batch request failed:', error);
      // Fallback to individual requests
      return Promise.allSettled(requests.map(req => this.request(req.endpoint, req.options)));
    }
  }

  // Queue requests for batch processing
  addToQueue(request) {
    this.requestQueue.push(request);
    
    if (this.requestQueue.length >= 10 && !this.isProcessingQueue) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      const batch = this.requestQueue.splice(0, 10);
      const results = await this.batchRequest(batch);
      
      // Process results
      results.forEach((result, index) => {
        const request = batch[index];
        if (request.onSuccess) {
          request.onSuccess(result);
        }
      });
    } catch (error) {
      console.error('Queue processing failed:', error);
      
      // Fallback to individual processing
      const batch = this.requestQueue.splice(0, 10);
      for (const request of batch) {
        try {
          const result = await this.request(request.endpoint, request.options);
          if (request.onSuccess) {
            request.onSuccess(result);
          }
        } catch (error) {
          if (request.onError) {
            request.onError(error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
      
      // Process remaining items if any
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  // Upload file with progress tracking
  async uploadFile(endpoint, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      
      if (this.authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      xhr.send(formData);
    });
  }

  // Retry mechanism for failed requests
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  // Mock API for development/testing
  async mockRequest(endpoint, options = {}) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Mock responses based on endpoint
    if (endpoint.includes('/health')) {
      return { status: 'ok', timestamp: new Date().toISOString() };
    }
    
    if (endpoint.includes('/interviews')) {
      return { id: 'mock-interview-id', status: 'active' };
    }
    
    if (endpoint.includes('/messages')) {
      return { id: 'mock-message-id', status: 'sent' };
    }
    
    return { success: true, message: 'Mock response' };
  }

  // Enable mock mode for development
  enableMockMode() {
    this.request = this.mockRequest.bind(this);
    console.log('Mock mode enabled for API service');
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Export class for testing or multiple instances
export { ApiService };
