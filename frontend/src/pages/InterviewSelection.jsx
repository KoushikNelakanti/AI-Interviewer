import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Clock, 
  FileText, 
  Play, 
  ArrowLeft, 
  Brain, 
  Code, 
  Users,
  Zap,
  Target,
  Calendar,
  Upload
} from 'lucide-react';

const InterviewSelection = () => {
  const [interview, setInterview] = useState("technical");
  const [duration, setDuration] = useState("30 min");
  const [role, setRole] = useState("Software Engineer");
  const [resumeFile, setResumeFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const interviewTypes = [
    {
      id: "hr",
      title: "HR Interview",
      description: "Behavioral questions and company culture fit",
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "technical",
      title: "Technical Interview",
      description: "Technical skills assessment and problem solving",
      icon: <Code className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "code-pairing",
      title: "Code Pairing",
      description: "Live coding session with AI interviewer",
      icon: <Brain className="w-6 h-6" />,
      color: "from-green-500 to-green-600"
    }
  ];

  const durations = [
    { value: "15 min", label: "15 minutes", description: "Quick assessment" },
    { value: "30 min", label: "30 minutes", description: "Standard interview" },
    { value: "45 min", label: "45 minutes", description: "Comprehensive review" },
    { value: "60 min", label: "60 minutes", description: "Deep dive session" }
  ];

  const popularRoles = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "DevOps Engineer",
    "Product Manager",
    "UI/UX Designer"
  ];

  const handleInterviewSelect = (type) => {
    setInterview(type);
  };

  const handleDurationSelect = (time) => {
    setDuration(time);
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const startInterview = async () => {
    if (!role.trim()) {
      alert('Please enter a target role');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const params = new URLSearchParams({
        type: interview,
        duration: duration,
        role: role
      });
      
      if (resumeFile) {
        params.append('resume', resumeFile.name);
      }
      
      const id = (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
      navigate(`/interview/${id}`);
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Interview Setup</h1>
              <p className="text-gray-400 text-sm">Configure your AI interview session</p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Role Selection */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Target Role</h2>
          </div>
          
          <div className="mb-4">
            <input
              className="w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm text-white rounded-2xl border border-gray-600/50 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-gray-400"
              placeholder="e.g. Senior Frontend Developer, Full Stack Engineer..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularRoles.map((popularRole) => (
              <button
                key={popularRole}
                onClick={() => handleRoleSelect(popularRole)}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  role === popularRole
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50'
                }`}
              >
                {popularRole}
              </button>
            ))}
          </div>
        </div>

        {/* Interview Type Selection */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Interview Type</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interviewTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleInterviewSelect(type.id)}
                className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 hover:transform hover:scale-105 ${
                  interview === type.id
                    ? 'border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-600/25'
                    : 'border-gray-600/50 bg-gray-800/50 backdrop-blur-sm hover:border-gray-500/50'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${type.color} rounded-full text-white mb-4`}>
                  {type.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{type.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{type.description}</p>
                
                {interview === type.id && (
                  <div className="mt-4 flex items-center text-blue-400 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">Duration</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {durations.map((durationOption) => (
              <button
                key={durationOption.value}
                onClick={() => handleDurationSelect(durationOption.value)}
                className={`p-4 rounded-xl text-center transition-all duration-200 ${
                  duration === durationOption.value
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/50'
                }`}
              >
                <div className="font-semibold">{durationOption.label}</div>
                <div className="text-xs opacity-80">{durationOption.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resume Upload */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">Resume (Optional)</h2>
          </div>
          
          <div className="border-2 border-dashed border-gray-600/50 rounded-2xl p-8 text-center hover:border-gray-500/50 transition-colors duration-200">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Upload your resume for personalized questions</p>
            <p className="text-gray-500 text-sm mb-4">Supports PDF, DOC, TXT files</p>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg cursor-pointer transition-colors duration-200 border border-gray-600/50"
            >
              Choose File
            </label>
            
            {resumeFile && (
              <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">
                  ✓ {resumeFile.name} uploaded successfully
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Start Interview Button */}
        <div className="text-center">
          <button
            onClick={startInterview}
            disabled={isLoading || !role.trim()}
            className={`group px-12 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl ${
              isLoading || !role.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-600/25'
            } flex items-center space-x-3 mx-auto`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Preparing Interview...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Interview</span>
              </>
            )}
          </button>
          
          {!role.trim() && (
            <p className="text-red-400 text-sm mt-2">Please enter a target role to continue</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">500ms</div>
            <div className="text-gray-400 text-sm">Response Time</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">AI-Powered</div>
            <div className="text-gray-400 text-sm">Interviewer</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <Code className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">7+</div>
            <div className="text-gray-400 text-sm">Languages</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSelection;