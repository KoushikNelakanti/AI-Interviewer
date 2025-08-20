import React, { useEffect, useRef } from 'react';

const SpeakingAura = ({ 
  isSpeaking, 
  color = '#4f46e5', // Default indigo color
  size = 'md',
  pulseSpeed = 'normal',
  className = '',
  children
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };
  
  // Animation speed variants
  const speedClasses = {
    slow: 'animate-pulse-slow',
    normal: 'animate-pulse',
    fast: 'animate-pulse-fast'
  };
  
  // Get the appropriate size and speed classes
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const speedClass = speedClasses[pulseSpeed] || speedClasses.normal;
  
  return (
    <div className={`relative ${className}`}>
      {/* The aura effect */}
      {isSpeaking && (
        <div 
          className={`absolute inset-0 rounded-full ${speedClass} z-0`}
          style={{
            backgroundColor: color,
            opacity: 0.5,
            transform: 'scale(1.5)',
            filter: 'blur(8px)'
          }}
        />
      )}
      
      {/* Slot for the avatar/content */}
      <div className={`relative z-10 ${sizeClass} rounded-full overflow-hidden`}>
        {children}
      </div>
    </div>
  );
};

// Profile component that combines the aura with an avatar
const ProfileWithAura = ({
  image,
  alt = 'Profile',
  isSpeaking = false,
  role = 'user', // 'user' or 'interviewer'
  size = 'md',
  className = ''
}) => {
  // Different colors for different roles
  const auraColor = role === 'interviewer' ? '#10b981' : '#4f46e5'; // Green for interviewer, indigo for user
  
  // Size variants for the inner content
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <SpeakingAura 
      isSpeaking={isSpeaking} 
      color={auraColor}
      size={size}
      pulseSpeed="normal"
      className={className}
    >
      <div className={`w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700`}>
        {image ? (
          <img 
            src={image} 
            alt={alt} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-2xl font-bold text-gray-500 dark:text-gray-300">
            {role === 'interviewer' ? 'AI' : 'You'}
          </div>
        )}
      </div>
    </SpeakingAura>
  );
};

export { SpeakingAura, ProfileWithAura };
export default SpeakingAura;