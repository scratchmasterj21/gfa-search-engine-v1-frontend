import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AIResponse } from '../services/aiService';
import { 
  LoadingSpinner, 
  CheckIcon 
} from './AnimatedIcons';

interface AIResultsCardProps {
  aiResponse: AIResponse | null;
  isLoading: boolean;
  error: string | null;
  query?: string;
  onCopyAnswer?: (answer: string) => void;
}

const AIResultsCard: React.FC<AIResultsCardProps> = ({
  aiResponse,
  isLoading,
  error,
  query = '',
  onCopyAnswer
}) => {
  const { actualTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  // Check if the query contains Japanese characters
  const isJapaneseQuery = (query: string) => {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(query);
  };

  // Get localized text based on query language
  const getLocalizedText = (query: string) => {
    const isJapanese = isJapaneseQuery(query);
    return {
      copyAnswer: isJapanese ? '回答をコピー' : 'Copy Answer',
      regenerate: isJapanese ? '再生成' : 'Regenerate',
      aiAnswer: isJapanese ? 'AI回答' : 'AI Answer',
      relatedTopics: isJapanese ? '関連トピック' : 'Related Topics',
      generatedAt: isJapanese ? '生成時刻' : 'Generated',
      loading: isJapanese ? 'AIが回答を生成中...' : 'AI is generating an answer...',
      error: isJapanese ? 'AI回答の生成中にエラーが発生しました' : 'Error generating AI response'
    };
  };

  // Get localized text based on the query
  const localizedText = getLocalizedText(query || aiResponse?.query || '');

  const handleCopyAnswer = async () => {
    if (aiResponse?.answer && onCopyAnswer) {
      await onCopyAnswer(aiResponse.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  const cardClasses = `
    relative overflow-hidden transition-all duration-300 transform
    ${actualTheme === 'dark' 
      ? 'bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/30' 
      : 'bg-gradient-to-br from-purple-50 to-cyan-50 border border-purple-200/50'
    }
    backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl
    ${actualTheme === 'dark' 
      ? 'hover:shadow-purple-500/20' 
      : 'hover:shadow-purple-500/10'
    }
  `;

  const titleClasses = `
    font-bold text-lg mb-3 flex items-center
    ${actualTheme === 'dark' 
      ? 'text-purple-300' 
      : 'text-purple-700'
    }
  `;

  const answerClasses = `
    leading-relaxed font-medium
    ${actualTheme === 'dark' 
      ? 'text-gray-200' 
      : 'text-gray-800'
    }
  `;


  if (isLoading) {
    return (
      <div className={`${cardClasses} mb-6 animate-in slide-in-from-top-3 duration-500`}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="relative mr-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <div className="w-4 h-4 text-white animate-pulse">🤖</div>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-ping opacity-20"></div>
            </div>
            <h3 className={titleClasses}>
              {localizedText.loading}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" color="primary" />
            <span className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {localizedText.loading}
            </span>
          </div>
          
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardClasses} mb-6 animate-in slide-in-from-top-3 duration-500`}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
              <div className="w-4 h-4 text-red-500">⚠️</div>
            </div>
            <h3 className={`${titleClasses} text-red-500`}>
              {localizedText.error}
            </h3>
          </div>
          
          <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {error}
          </p>
          
        </div>
      </div>
    );
  }

  if (!aiResponse) {
    return null;
  }

  return (
    <div className={`${cardClasses} mb-6 animate-in slide-in-from-top-3 duration-500`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="relative mr-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <div className="w-4 h-4 text-white">🤖</div>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse opacity-30"></div>
            </div>
            <h3 className={titleClasses}>
              {localizedText.aiAnswer}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center text-xs ${getConfidenceColor(aiResponse.confidence)}`}>
              <div className={`w-2 h-2 rounded-full mr-1 ${getConfidenceColor(aiResponse.confidence).replace('text-', 'bg-')}`}></div>
              {getConfidenceText(aiResponse.confidence)}
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="mb-4">
          <p className={answerClasses}>
            {aiResponse.answer}
          </p>
        </div>

        {/* Sources */}
        {aiResponse.sources.length > 0 && (
          <div className="mb-4">
            <h4 className={`text-sm font-semibold mb-2 ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {localizedText.relatedTopics}:
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiResponse.sources.map((source, index) => (
                <span
                  key={index}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                    ${actualTheme === 'dark' 
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/20">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyAnswer}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${actualTheme === 'dark' 
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${copied ? 'bg-green-500 text-white' : ''}
              `}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{localizedText.copyAnswer}</span>
                </>
              )}
            </button>
            
          </div>
          
          <div className={`text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {localizedText.generatedAt} {aiResponse.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default AIResultsCard;
