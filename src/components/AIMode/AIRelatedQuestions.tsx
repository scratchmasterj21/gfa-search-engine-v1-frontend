import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useHapticFeedback } from '../../hooks/useTouchGestures';

interface AIRelatedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

const AIRelatedQuestions: React.FC<AIRelatedQuestionsProps> = ({ 
  questions, 
  onQuestionClick 
}) => {
  const { actualTheme } = useTheme();
  const { isMobile } = useResponsive();
  const { triggerHaptic } = useHapticFeedback();

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleClick = (question: string) => {
    if (isMobile) {
      triggerHaptic('light');
    }
    onQuestionClick(question);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center mb-3">
        <span className="text-xl mr-2">💡</span>
        <h4 className={`
          font-semibold text-sm
          ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
        `}>
          Related Questions
        </h4>
      </div>

      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleClick(question)}
            className={`
              w-full text-left px-4 py-3 rounded-xl transition-all duration-200 
              hover-lift touch-feedback group
              ${actualTheme === 'dark'
                ? 'bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/30 hover:border-gray-600'
                : 'bg-purple-50/50 hover:bg-purple-100/70 border border-purple-200/30 hover:border-purple-300'
              }
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start space-x-3">
              <span className={`
                flex-shrink-0 text-lg transition-transform group-hover:scale-110
              `}>
                •
              </span>
              <span className={`
                flex-1 text-sm font-medium group-hover:text-gradient transition-colors
                ${actualTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}
              `}>
                {question}
              </span>
              <svg 
                className={`
                  flex-shrink-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity
                  ${actualTheme === 'dark' ? 'text-cyan-400' : 'text-purple-600'}
                `}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIRelatedQuestions;

