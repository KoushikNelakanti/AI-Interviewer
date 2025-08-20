import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Video, 
  Code, 
  Brain, 
  Clock, 
  Users, 
  ArrowRight, 
  Play,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Real-time Voice Recognition",
      description: "Advanced speech-to-text with Deepgram for instant transcription"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Interviews",
      description: "Gemini AI provides intelligent, contextual interview questions"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Live Video Interface",
      description: "Professional video interview experience with real-time feedback"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Code Editor Integration",
      description: "Built-in code editor for technical interviews with multiple languages"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Low Latency",
      description: "WebSocket-based real-time communication for seamless interaction"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your interview data stays private and secure"
    }
  ];

  const stats = [
    { label: "Response Time", value: "< 500ms", icon: <Clock className="w-4 h-4" /> },
    { label: "Languages", value: "7+", icon: <Code className="w-4 h-4" /> },
    { label: "Users", value: "1000+", icon: <Users className="w-4 h-4" /> }
  ];

  const patternSvg = encodeURIComponent(
    '<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#9C92AC" fill-opacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url("data:image/svg+xml,${patternSvg}")` }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-8">
              <Globe className="w-4 h-4 mr-2" />
              Next-Generation AI Interview Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              AI Interview
              <span className="block text-3xl md:text-4xl text-blue-400 mt-2">Platform</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the future of interviews with real-time AI assistance, 
              voice recognition, and seamless code collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => navigate('/interview-selection')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-blue-600/25 flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Start Interview</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              {/* <button
                onClick={() => navigate('/interview')}
                className="px-8 py-4 bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold rounded-2xl transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50"
              >
                Quick Start
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-full text-blue-400 mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose AI Interview Platform?</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Built with cutting-edge technology for the most seamless interview experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-full text-blue-400 mb-4 group-hover:bg-blue-600/30 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center p-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl border border-blue-500/30">
          <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Interview?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of candidates who have improved their interview skills with our AI-powered platform.
          </p>
          <button
            onClick={() => navigate('/interview-selection')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-blue-600/25 flex items-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 AI Interview Platform. Built with cutting-edge AI technology.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;