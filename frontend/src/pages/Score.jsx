import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  TrendingUp, 
  MessageSquare, 
  Code, 
  Brain, 
  Target, 
  ArrowLeft, 
  Download,
  Share2,
  Star,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Clock,
  Users
} from 'lucide-react';

// Enhanced scoring algorithm
function computeLocalScore(log) {
  if (!log || log.length === 0) return null;
  
  const totalMessages = log.length;
  const userMsgs = log.filter(m => m.sender === 'user');
  const aiMsgs = log.filter(m => m.sender === 'interviewer');
  
  // Enhanced scoring metrics
  const avgLen = (arr) => arr.reduce((a, b) => a + (b.text?.length || 0), 0) / Math.max(1, arr.length);
  
  // Communication Skills (based on response length and engagement)
  const communicationSkills = Math.min(10, Math.round((avgLen(userMsgs) / 120) * 10));
  
  // Technical Knowledge (based on AI response complexity)
  const technicalKnowledge = Math.min(10, Math.round((avgLen(aiMsgs) / 140) * 10));
  
  // Problem Solving (based on user engagement ratio)
  const problemSolving = Math.min(10, Math.round((userMsgs.length / Math.max(1, totalMessages)) * 10));
  
  // Code Quality (based on code sharing and technical discussion)
  const codeQuality = Math.min(10, Math.round((log.filter(m => m.isCode || m.text?.includes('```')).length > 0 ? 8 : 5)));
  
  // Engagement Level (based on conversation flow)
  const engagementLevel = Math.min(10, Math.round((totalMessages / 20) * 10));
  
  // Overall score with weighted components
  const overall = Math.round(
    (communicationSkills * 0.25 + 
     technicalKnowledge * 0.25 + 
     problemSolving * 0.2 + 
     codeQuality * 0.2 + 
     engagementLevel * 0.1)
  );
  
  // Dynamic feedback based on performance
  const strengths = [];
  const improvements = [];
  
  if (communicationSkills >= 8) strengths.push("Excellent communication skills");
  if (technicalKnowledge >= 8) strengths.push("Strong technical foundation");
  if (problemSolving >= 8) strengths.push("Great problem-solving approach");
  if (codeQuality >= 8) strengths.push("High-quality code examples");
  if (engagementLevel >= 8) strengths.push("Highly engaged throughout");
  
  if (communicationSkills < 6) improvements.push("Work on clear articulation");
  if (technicalKnowledge < 6) improvements.push("Strengthen technical concepts");
  if (problemSolving < 6) improvements.push("Practice structured problem-solving");
  if (codeQuality < 6) improvements.push("Include more code examples");
  if (engagementLevel < 6) improvements.push("Maintain consistent engagement");
  
  // Default strengths/improvements if none detected
  if (strengths.length === 0) strengths.push("Good interview participation");
  if (improvements.length === 0) improvements.push("Continue practicing for improvement");
  
  return {
    communicationSkills,
    technicalKnowledge,
    problemSolving,
    codeQuality,
    engagementLevel,
    overall,
    strengths,
    improvements,
    summary: generateSummary(overall, totalMessages),
    conversationStats: {
      totalMessages,
      userMessages: userMsgs.length,
      aiMessages: aiMsgs.length,
      averageUserResponseLength: Math.round(avgLen(userMsgs)),
      averageAIResponseLength: Math.round(avgLen(aiMsgs))
    }
  };
}

function generateSummary(overall, totalMessages) {
  if (overall >= 9) {
    return "Outstanding performance! You demonstrated exceptional skills across all areas. Your communication was clear, technical knowledge was solid, and problem-solving approach was excellent. You're well-prepared for technical interviews.";
  } else if (overall >= 7) {
    return "Strong performance with room for growth. You showed good technical understanding and communication skills. Focus on the areas for improvement to reach the next level.";
  } else if (overall >= 5) {
    return "Good foundation with significant improvement opportunities. You have the basic skills needed but should focus on strengthening technical knowledge and communication clarity.";
  } else {
    return "This interview revealed areas that need attention. Focus on building technical fundamentals and improving communication skills. Regular practice will help you improve significantly.";
  }
}

const Score = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const key = `conversation_${id}`;
    const raw = localStorage.getItem(key);
    const log = raw ? JSON.parse(raw) : [];
    const s = computeLocalScore(log);
    setScore(s);
    setLoading(false);
  }, [id]);

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Generating your interview score...</p>
      </div>
    </div>
  );
}

  if (!score) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-gray-300">No interview data available.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            Return Home
          </button>
        </div>
  </div>
);
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-600/20 border-green-500/30';
    if (score >= 6) return 'bg-yellow-600/20 border-yellow-500/30';
    return 'bg-red-600/20 border-red-500/30';
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
              <h1 className="text-2xl font-bold">Interview Results</h1>
              <p className="text-gray-400 text-sm">Your performance analysis and feedback</p>
            </div>
            <div className="flex space-x-3">
              <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overall Score Card */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl border border-blue-500/30 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-2">Overall Score</h2>
            <div className={`text-8xl font-bold mb-4 ${getScoreColor(score.overall)}`}>
              {score.overall}/10
            </div>
            <div className="text-xl text-gray-300 max-w-2xl mx-auto">
              {score.summary}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'details', label: 'Detailed Scores', icon: <Target className="w-4 h-4" /> },
            { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'stats', label: 'Statistics', icon: <TrendingUp className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              icon={<MessageSquare className="w-6 h-6" />}
              label="Communication"
              value={score.communicationSkills}
              color="blue"
            />
            <MetricCard
              icon={<Brain className="w-6 h-6" />}
              label="Technical Knowledge"
              value={score.technicalKnowledge}
              color="purple"
            />
            <MetricCard
              icon={<Target className="w-6 h-6" />}
              label="Problem Solving"
              value={score.problemSolving}
              color="green"
            />
            <MetricCard
              icon={<Code className="w-6 h-6" />}
              label="Code Quality"
              value={score.codeQuality}
              color="yellow"
            />
            <MetricCard
              icon={<Users className="w-6 h-6" />}
              label="Engagement"
              value={score.engagementLevel}
              color="indigo"
            />
            <MetricCard
              icon={<Clock className="w-6 h-6" />}
              label="Duration"
              value={`${score.conversationStats.totalMessages} messages`}
              color="gray"
              isText
            />
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {[
              { key: 'communicationSkills', label: 'Communication Skills', icon: <MessageSquare className="w-5 h-5" /> },
              { key: 'technicalKnowledge', label: 'Technical Knowledge', icon: <Brain className="w-5 h-5" /> },
              { key: 'problemSolving', label: 'Problem Solving', icon: <Target className="w-5 h-5" /> },
              { key: 'codeQuality', label: 'Code Quality', icon: <Code className="w-5 h-5" /> },
              { key: 'engagementLevel', label: 'Engagement Level', icon: <Users className="w-5 h-5" /> }
            ].map((metric) => (
              <div key={metric.key} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-400">{metric.icon}</div>
                    <h3 className="text-xl font-semibold">{metric.label}</h3>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(score[metric.key])}`}>
                    {score[metric.key]}/10
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      score[metric.key] >= 8 ? 'bg-green-500' :
                      score[metric.key] >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(score[metric.key] / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {score.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-semibold">Areas for Improvement</h3>
              </div>
              <ul className="space-y-2">
                {score.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{improvement}</span>
                  </li>
        ))}
      </ul>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(score.conversationStats).map(([key, value]) => (
              <div key={key} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{value}</div>
                <div className="text-gray-400 text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 text-center space-x-4">
          <button
            onClick={() => navigate('/interview-selection')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/25"
          >
            Practice Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold rounded-2xl transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, color, isText = false }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      indigo: 'from-indigo-500 to-indigo-600',
      gray: 'from-gray-500 to-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 text-center group hover:border-gray-600/50 transition-all duration-300">
      <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${getColorClasses(color)} rounded-full text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white">{label}</h3>
      <div className={`text-2xl font-bold ${isText ? 'text-gray-300' : 'text-blue-400'}`}>
        {value}
      </div>
  </div>
);
};

export default Score;