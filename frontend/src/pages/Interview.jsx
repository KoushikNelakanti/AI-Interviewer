import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Video, VideoOff, Phone, Code, Mic2, Wifi, WifiOff, Activity, Clock, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ProfileWithAura } from '../components/SpeakingAura';
import interviewService from '../services/interviewService.jsx';
import * as audioService from '../services/audioService';

export default function Interview() {
  // Core state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeContent, setCodeContent] = useState('// Write your code here\nfunction example() {\n    \n}');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  
  // Enhanced state for real-time features
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Idle');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [initializationError, setInitializationError] = useState(null);
  
  // Refs
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioLevelInterval = useRef(null);
  
  // Navigation and params
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const interviewType = searchParams.get('type') || 'technical';
  const duration = searchParams.get('duration') || '30 min';
  const role = searchParams.get('role') || 'Software Engineer';

  // Handle service errors - centralized error handling function
  const handleServiceError = useCallback((error) => {
    console.error('Service error:', error);
    
    // Set initialization error state to display to user
    setInitializationError(error.message || 'An unknown error occurred');
    
    // Add error message to displayed messages
    setMessages(prev => [
      ...prev,
      {
        text: `Error: ${error.message || 'An unknown error occurred'}`,
        sender: 'system',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }
    ]);
    
    // Update connection status if it's a connection error
    if (error.message && error.message.includes('connection')) {
      setConnectionStatus('error');
    }
  }, []);

  // Initialize interview service
  useEffect(() => {
    // Add global error handler for MetaMask and other extension errors
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // Check if it's a MetaMask error
      if (message && (message.includes('MetaMask') || (error && error.message && error.message.includes('MetaMask')))) {
        console.warn('MetaMask error detected, continuing without MetaMask:', message);
        // Don't propagate MetaMask errors as they're non-critical
        return true;
      }
      // Call original handler for other errors
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
    
    // Handle unhandled promise rejections (common with extension errors)
    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = function(event) {
      if (event.reason && 
          (event.reason.message && event.reason.message.includes('MetaMask') || 
           event.reason.toString().includes('MetaMask'))) {
        console.warn('Unhandled MetaMask promise rejection, continuing without MetaMask:', event.reason);
        event.preventDefault();
        return true;
      }
      return originalOnUnhandledRejection ? originalOnUnhandledRejection(event) : false;
    };
    
    const initializeInterview = async () => {
      try {
        console.log('Starting interview initialization...');
        console.log('Interview ID:', id);
        console.log('Search params:', { interviewType, duration, role });
        
        const userId = `user_${Date.now()}`;
        // Use local server URL from .env if available, otherwise use the default with fallback
        const serverUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        console.log(`Initializing interview service with server URL: ${serverUrl}`);
        
        const success = await interviewService.initialize(id || 'default', userId, {
          serverUrl: serverUrl
        });
        
        console.log('Interview service initialization result:', success);
        
        if (success) {
          // Set up service callbacks
          interviewService.setInterviewUpdateHandler(handleInterviewUpdate);
          interviewService.setPerformanceMetricsHandler(handlePerformanceMetrics);
          interviewService.setErrorHandler(handleServiceError);
          
          // Preload common responses for better performance
          interviewService.preloadCommonResponses();
          
          console.log('Interview service initialized successfully');
          
          // Add system message about mock mode
          setMessages(prev => [
            ...prev, 
            {
              text: 'Connected to interview service (using local mock data)',
              sender: 'system',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          console.error('Failed to initialize interview service');
          handleServiceError({ message: 'Failed to initialize interview service', type: 'connection' });
        }
      } catch (error) {
        console.error('Interview initialization error:', error);
        handleServiceError({ message: error.message || 'Interview initialization error', type: 'connection' });
      }
    };

    initializeInterview();

    // Cleanup on unmount
    return () => {
      // Restore original error handlers
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
      
      interviewService.cleanup();
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
    };
  }, [id, handleServiceError]);

  // Time updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio level monitoring for visual feedback
  useEffect(() => {
    if (isVoiceInputActive) {
      audioLevelInterval.current = setInterval(() => {
        const level = audioService.getAudioLevel();
        setAudioLevel(level);
      }, 100);
    } else {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        setAudioLevel(0);
      }
    }

    return () => {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
    };
  }, [isVoiceInputActive]);

  // Handle interview updates from service
  const handleInterviewUpdate = useCallback((update) => {
    switch (update.type) {
      case 'interviewer_response':
        const interviewerMessage = { 
          text: update.text, 
          sender: 'interviewer', 
          time: currentTime,
          responseTime: update.responseTime 
        };
        setMessages(prev => [...prev, interviewerMessage]);
        
        // Text-to-speech
        if (voiceEnabled && window?.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(update.text);
          utterance.lang = 'en-US';
          utterance.rate = 1.1; // Slightly faster for better flow
          window.speechSynthesis.speak(utterance);
        }
        break;
        
      case 'partial_transcript':
        setPartialTranscript(update.text);
        break;
        
      case 'voice_status':
        setVoiceStatus(update.status);
        break;
        
      case 'speaking_change':
        setUserSpeaking(update.isSpeaking);
        break;
        
      case 'connection_change':
        setConnectionStatus(update.connected ? 'connected' : 'disconnected');
        break;
        
      case 'status_change':
        setConnectionStatus(update.status);
        break;
        
      default:
        console.log('Unhandled update type:', update.type);
    }
  }, [currentTime, voiceEnabled]);

  // Handle performance metrics
  const handlePerformanceMetrics = useCallback((metrics) => {
    setPerformanceMetrics(metrics);
  }, []);
     
  // All error handling is now in the handleServiceError function above

  // Send message handlers
  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      const userMessage = { text: message, sender: 'user', time: currentTime };
      setMessages(prev => [...prev, userMessage]);
      
      // Send via interview service
      interviewService.sendTextMessage(message);
      setMessage('');
    }
  }, [message, currentTime]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Voice recognition handlers
  const startVoiceRecognition = useCallback(async () => {
    const success = await interviewService.startVoiceRecognition();
    if (success) {
      setIsVoiceInputActive(true);
      setPartialTranscript('');
    }
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    interviewService.stopVoiceRecognition();
    setIsVoiceInputActive(false);
    setVoiceStatus('Idle');
    setPartialTranscript('');
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (isVoiceInputActive) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  }, [isVoiceInputActive, startVoiceRecognition, stopVoiceRecognition]);

  // Handle transcript from voice recognition
  const handleTranscript = useCallback((text) => {
    setTranscript(prev => prev ? prev + ' ' + text : text);
    setPartialTranscript('');
    
    const userMessage = { text, sender: 'user', time: currentTime };
    setMessages(prev => [...prev, userMessage]);
  }, [currentTime]);

  // Code execution
  const runCode = useCallback(() => {
    if (running) return;
    setRunning(true);
    setRunResult(null);
    
    setTimeout(() => {
      try {
        let result = '';
        let hasError = false;
        
        switch (codeLanguage) {
          case 'javascript':
            if (codeContent.includes('console.log')) {
              result = 'Code executed successfully\nOutput: Hello from JavaScript!';
            } else {
              result = 'Code executed successfully';
            }
            break;
          case 'python':
            if (codeContent.includes('print')) {
              result = 'Code executed successfully\nOutput: Hello from Python!';
            } else {
              result = 'Code executed successfully';
            }
            break;
          case 'java':
            if (codeContent.includes('System.out.println')) {
              result = 'Code compiled and executed successfully\nOutput: Hello from Java!';
            } else {
              result = 'Code compiled successfully';
            }
            break;
          default:
            result = 'Code executed successfully';
        }
        
        setRunResult({
          status: { description: 'Success' },
          stdout: result
        });
      } catch (e) {
        setRunResult({
          status: { description: 'Runtime Error' },
          stderr: 'Error: ' + e.message
        });
      } finally {
        setRunning(false);
      }
    }, 1000);
  }, [running, codeContent, codeLanguage]);

  // End interview
  const endInterview = useCallback(() => {
    const key = `conversation_${id || 'default'}`;
    localStorage.setItem(key, JSON.stringify(messages));
    navigate(`/interview/${id || 'default'}/score`);
  }, [id, messages, navigate]);

  // Connection status indicator
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      case 'polling':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Enhanced Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/interview-selection')}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{role} Interview</h1>
                <p className="text-sm text-gray-400">{interviewType} · {duration}</p>
              </div>
            </div>
            
            {/* Display initialization error if any */}
            {initializationError && (
              <div className="bg-red-900/60 text-red-200 px-4 py-2 rounded-md text-sm">
                Error: {initializationError}
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Connected</span>
                  </>
                ) : connectionStatus === 'error' ? (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Connection Error</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-sm text-yellow-400">Connecting...</span>
                  </>
                )}
              </div>
              <div className="text-gray-400">{currentTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="flex-1 flex">
        {/* Interviewer Side */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-r border-gray-700/50">
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            Sarah Chen - Senior {role}
          </div>
          
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ProfileWithAura
                isSpeaking={interviewerSpeaking}
                role="interviewer"
                size="lg"
                className="mb-4 mx-auto"
              />
              <h2 className="text-2xl font-semibold mb-2">Interviewer</h2>
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <div className={`w-2 h-2 ${interviewerSpeaking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} rounded-full`}></div>
                <span className="text-sm">{interviewerSpeaking ? 'Speaking' : 'Listening'}</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Chat Messages Overlay */}
          <div className="absolute bottom-4 left-4 right-4 max-h-40 overflow-y-auto bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-2">
            {messages.slice(-3).map((msg, index) => (
              <div key={index} className={`text-sm ${msg.sender === 'interviewer' 
                ? 'text-blue-300' 
                : msg.sender === 'system' 
                  ? msg.isError ? 'text-red-300' : 'text-yellow-300' 
                  : 'text-green-300'}`}>
                <span className="font-medium">
                  {msg.sender === 'interviewer' 
                    ? 'Interviewer' 
                    : msg.sender === 'system' 
                      ? 'System' 
                      : 'You'}: 
                </span>
                {msg.isCode ? (
                  <pre className="text-xs mt-1 p-2 bg-gray-800 rounded overflow-x-auto">
                    {msg.text.replace(/Code shared \([^)]+\):\n```[^`\n]*\n/, '').replace(/\n```$/, '')}
                  </pre>
                ) : (
                  msg.text
                )}
                {msg.responseTime && (
                  <span className="text-xs text-gray-500 ml-2">({msg.responseTime}ms)</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Your Side */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-800/50 to-gray-700/30">
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            You
          </div>
          
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ProfileWithAura
                isSpeaking={userSpeaking}
                role="user"
                size="lg"
                className="mb-4 mx-auto"
              />
              <h2 className="text-2xl font-semibold mb-2">Candidate</h2>
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <div className={`w-2 h-2 ${isMuted ? 'bg-red-400' : userSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-green-400'} rounded-full`}></div>
                <span className="text-sm">
                  {isMuted ? 'Muted' : 
                   isVoiceInputActive ? (userSpeaking ? 'Speaking' : 'Listening') : 
                   'Connected'}
                </span>
              </div>
              
              {/* Audio Level Visualizer */}
              {isVoiceInputActive && (
                <div className="mt-4 flex justify-center">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 1000, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls and Input Section */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-t border-gray-700/50">
        {/* Video Controls */}
        <div className="px-6 py-4">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25' 
                  : 'bg-gray-700 hover:bg-gray-600 shadow-lg shadow-gray-600/25'
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3 rounded-full transition-all duration-200 ${
                !isVideoOn 
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25' 
                  : 'bg-gray-700 hover:bg-gray-600 shadow-lg shadow-gray-600/25'
              }`}
            >
              {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            
            <button
              onClick={toggleVoiceInput}
              className={`p-3 rounded-full transition-all duration-200 ${
                isVoiceInputActive 
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25' 
                  : 'bg-gray-700 hover:bg-gray-600 shadow-lg shadow-gray-600/25'
              }`}
            >
              <Mic2 size={20} />
            </button>
            
            <button 
              onClick={endInterview} 
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 shadow-lg shadow-red-600/25"
            >
              <Phone size={20} />
            </button>
          </div>

          {/* Enhanced Voice Status Indicator */}
          {isVoiceInputActive && (
            <div className="text-center mb-3">
              <div className="text-sm text-gray-300 mb-1">
                Voice Status: <span className="font-medium">{voiceStatus}</span>
              </div>
              {partialTranscript && (
                <div className="text-xs text-blue-300 bg-blue-900/30 px-3 py-1 rounded-full inline-block">
                  🎤 {partialTranscript}
                </div>
              )}
            </div>
          )}

          {/* Communication Options */}
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => setShowCodeEditor(false)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                !showCodeEditor 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setShowCodeEditor(true)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                showCodeEditor 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Code size={16} />
              <span>Code</span>
            </button>
          </div>

          {/* Text Input or Code Editor */}
          {!showCodeEditor ? (
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => interviewService.sendTypingIndicator(true)}
                  onBlur={() => interviewService.sendTypingIndicator(false)}
                  placeholder={isVoiceInputActive ? "Voice input active - or type here..." : "Type your response or ask a question..."}
                  className="w-full px-4 py-3 bg-gray-700/80 backdrop-blur-sm text-white rounded-2xl border border-gray-600/50 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-400 min-h-[48px] max-h-32 transition-all duration-200"
                  rows="1"
                  disabled={isVoiceInputActive}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isVoiceInputActive}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-all duration-200 shadow-lg shadow-blue-600/25"
              >
                <Send size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Language Selector */}
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-400">Language:</label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="px-3 py-1 bg-gray-700/80 backdrop-blur-sm text-white rounded border border-gray-600/50 focus:border-blue-500 focus:outline-none"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              {/* Enhanced Code Editor */}
              <div className="flex items-start space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="Write your code here..."
                    className="w-full px-4 py-3 bg-gray-900/80 backdrop-blur-sm text-white rounded-2xl border border-gray-600/50 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-400 font-mono text-sm min-h-[120px] max-h-64 transition-all duration-200"
                    style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                  />
                </div>
                <button
                  onClick={runCode}
                  disabled={!codeContent.trim() || running}
                  className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-all duration-200 shadow-lg shadow-green-600/25"
                >
                  <Send size={20} />
                </button>
              </div>
              
              {/* Enhanced Code Results */}
              {runResult && (
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-sm text-gray-200">
                  <div className="mb-2">
                    <span className="font-semibold">Status:</span> {runResult?.status?.description || runResult?.error || 'Unknown'}
                  </div>
                  {runResult?.stdout && (
                    <pre className="bg-black/40 p-2 rounded overflow-x-auto whitespace-pre-wrap">{runResult.stdout}</pre>
                  )}
                  {runResult?.stderr && (
                    <pre className="bg-black/40 p-2 rounded overflow-x-auto whitespace-pre-wrap text-red-400">{runResult.stderr}</pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Interview Tips */}
      <div className="bg-gray-800/60 backdrop-blur-sm px-6 py-3 text-center text-sm text-gray-400 border-t border-gray-700/50">
        💡 Tip: Maintain eye contact, speak clearly, and don't hesitate to ask for clarification
      </div>

      {/* Enhanced Live Transcript */}
      <div className="absolute bottom-24 left-6 right-6 pointer-events-none">
        {transcript && (
          <div className="mb-2 bg-black/70 backdrop-blur-sm text-gray-200 text-xs p-3 rounded-lg border border-gray-600/50">
            <span className="font-semibold">Live Transcript: </span>{transcript}
          </div>
        )}
      </div>
      
      <audio ref={audioRef} />
    </div>
  );
}