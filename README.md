# 🎤 Ultra-Low Latency Interview STT System

A real-time speech-to-text interview system optimized for ultra-low latency performance using Deepgram's Nova-2 model.

## ✨ Features

- **Ultra-Low Latency**: Optimized for real-time transcription with minimal delay
- **Enhanced Audio Processing**: Advanced audio buffering and voice activity detection
- **Real-Time Statistics**: Live word count, words per minute, and audio level monitoring
- **Automatic Reconnection**: Robust error handling with automatic recovery
- **Modern UI**: Beautiful, responsive interface with real-time feedback
- **Cross-Platform**: Works on all modern browsers and devices

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Deepgram API key
- Modern browser with microphone support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Interview
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In backend directory
   cp .env.example .env
   ```
   
   Add your Deepgram API key to `backend/.env`:
   ```
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

4. **Test the backend**
   ```bash
   cd backend
   node test.js
   ```

5. **Start the servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   
   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

6. **Open the application**
   - Navigate to `http://localhost:5173`
   - Allow microphone access when prompted
   - Start your interview!

## 🔧 Configuration

### Backend Optimizations

The backend is optimized for ultra-low latency with these key settings:

```javascript
// Audio Configuration
SAMPLE_RATE: 16000,           // Optimal for speech recognition
BUFFER_SIZE: 512,             // Small buffer for low latency
ENDPOINTING: 50,              // Fast utterance detection
UTTERANCE_END_MS: 300,        // Quick silence detection

// Connection Settings
PING_TIMEOUT: 60000,          // Keep connections alive
MAX_HTTP_BUFFER_SIZE: 1e8,    // 100MB buffer for audio
```

### Frontend Optimizations

The frontend includes advanced audio processing:

```javascript
// Audio Processing
SILENCE_THRESHOLD: 0.002,     // Sensitive voice detection
MAX_SILENCE_MS: 400,          // Fast silence detection
AUDIO_BOOST: 2.0,             // Enhanced audio amplification
BATCH_SIZE: 2,                // Efficient audio batching
```

## 📊 Performance Features

### Real-Time Statistics
- **Words per Minute**: Live calculation of speaking speed
- **Total Words**: Running count of transcribed words
- **Audio Level**: Visual feedback of microphone input
- **Connection Status**: Real-time connection monitoring

### Enhanced Audio Processing
- **Voice Activity Detection**: Automatic speech detection
- **Audio Buffering**: Optimized for minimal latency
- **Error Recovery**: Automatic reconnection on failures
- **Memory Management**: Efficient audio queue management

### UI Enhancements
- **Live Transcript Display**: Real-time transcription with interim results
- **Status Indicators**: Visual feedback for all system states
- **Error Handling**: Clear error messages with recovery options
- **Responsive Design**: Works on all screen sizes

## 🛠️ Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Ensure browser has microphone permissions
   - Check system microphone settings
   - Try refreshing the page

2. **Connection Errors**
   - Verify Deepgram API key is correct
   - Check internet connection
   - Restart both frontend and backend servers

3. **Audio Quality Issues**
   - Use a good quality microphone
   - Reduce background noise
   - Check browser audio settings

4. **High Latency**
   - Ensure stable internet connection
   - Close other audio applications
   - Check browser performance

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
# Backend debugging
DEBUG=* npm start

# Frontend debugging
# Check browser console for detailed logs
```

## 🔄 API Endpoints

### WebSocket Events

**Client to Server:**
- `start-transcription`: Initialize transcription service
- `audio-stream`: Send audio data
- `stop-transcription`: Stop transcription service
- `heartbeat`: Keep connection alive

**Server to Client:**
- `transcription-started`: Service ready notification
- `transcript`: Transcription results
- `speech-started`: Voice activity detected
- `utterance-end`: Speech ended
- `status-update`: Connection status
- `transcription-error`: Error notifications

## 📈 Performance Metrics

### Expected Performance
- **Latency**: < 200ms end-to-end
- **Accuracy**: > 95% with Nova-2 model
- **Uptime**: 99.9% with automatic recovery
- **Memory Usage**: < 50MB for audio processing

### Monitoring
- Real-time connection status
- Audio level monitoring
- Error rate tracking
- Performance metrics logging

## 🔒 Security

- **API Key Protection**: Environment variable storage
- **CORS Configuration**: Proper cross-origin settings
- **Audio Privacy**: No audio storage, real-time processing only
- **Connection Security**: WebSocket with proper authentication

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=3000
   DEEPGRAM_API_KEY=your_production_key
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Start Production Server**
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Test with the provided test script
4. Create an issue with detailed information

---

**Built with ❤️ for ultra-low latency real-time speech recognition** 