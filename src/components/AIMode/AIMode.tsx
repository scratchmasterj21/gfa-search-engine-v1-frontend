import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useHapticFeedback } from '../../hooks/useTouchGestures';
import { aiChatService } from '../../services/aiChatService';
import { logAIChat } from '../firebase';
import AIMessageCard from './AIMessageCard';
import AITypingIndicator from './AITypingIndicator';
import type { AIMessage, ConversationMessage } from '../../types/aiChat';

interface AIModeProps {
  initialQuery?: string;
}

const AIMode: React.FC<AIModeProps> = ({ initialQuery = '' }) => {
  const { actualTheme } = useTheme();
  const { isMobile } = useResponsive();
  const { triggerHaptic } = useHapticFeedback();

  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false); // Track if initial query was sent

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle initial query if provided - ONLY ONCE
  useEffect(() => {
    if (initialQuery && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true; // Mark as initialized
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]); // Only depend on initialQuery

  // Send message to AI
  const handleSendMessage = useCallback(async (messageText?: string, isRegeneration = false) => {
    const queryText = messageText || query.trim();
    
    if (!queryText || isLoading) return;

    // Clear input and add user message
    setQuery('');
    setError(null);
    
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    if (isMobile) {
      triggerHaptic('medium');
    }

    try {
      // Build conversation history for context
      const conversationHistory: ConversationMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call AI service
      const response = await aiChatService.sendMessage(queryText, conversationHistory);

      // Add AI response message
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        relatedQuestions: response.relatedQuestions,
        timestamp: new Date(),
        tokens: response.tokensUsed,
        confidence: response.confidence,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Log the AI chat to Firebase
      try {
        const messageNumber = Math.floor((messages.length + 2) / 2); // Count of user-AI exchanges
        await logAIChat(
          queryText,
          response.answer,
          response.conversationId,
          {
            messageNumber: messageNumber,
            conversationLength: messages.length + 2, // Include user + AI messages just added
            sources: response.sources,
            relatedQuestions: response.relatedQuestions,
            confidence: response.confidence,
            tokensUsed: response.tokensUsed,
            processingTime: response.processingTime,
            aiModel: 'gemini-2.0-flash-lite',
            wasRegenerated: isRegeneration
          }
        );
      } catch (logError) {
        console.error('Failed to log AI chat:', logError);
        // Don't block user experience if logging fails
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        error: errorMessage,
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [query, messages, isLoading, isMobile, triggerHaptic]);

  // Handle related question click
  const handleRelatedQuestionClick = useCallback((question: string) => {
    setQuery(question);
    handleSendMessage(question);
  }, [handleSendMessage]);

  // Handle regenerate
  const handleRegenerate = useCallback(async () => {
    if (messages.length < 2 || isLoading) return;

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove the last AI response
    setMessages(prev => prev.slice(0, -1));
    
    // Regenerate with isRegeneration flag set to true
    await handleSendMessage(lastUserMessage.content, true);
  }, [messages, isLoading, handleSendMessage]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setQuery('');
    setError(null);
    hasInitialized.current = false; // Reset initialization flag for new conversation
    inputRef.current?.focus();
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className={`
      min-h-screen flex flex-col
      ${isMobile ? 'pb-24' : 'pb-8'}
    `}>
      {/* Header */}
      <div className={`
        sticky top-0 z-20 backdrop-blur-lg border-b transition-all duration-300
        ${actualTheme === 'dark'
          ? 'bg-gray-900/80 border-gray-700/50'
          : 'bg-white/80 border-purple-200/50'
        }
        ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}
      `}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse opacity-30"></div>
            </div>
            <div>
              <h1 className={`
                font-bold
                ${isMobile ? 'text-lg' : 'text-xl'}
                ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                AI Mode
              </h1>
              <p className={`
                text-xs
                ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
              `}>
                Powered by Gemini
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleNewConversation}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 
                hover-scale touch-feedback
                ${actualTheme === 'dark'
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }
              `}
            >
              + New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`
        flex-1 overflow-y-auto
        ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}
      `}>
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16 animate-fade-in-scale">
              <div className="text-6xl mb-6">✨</div>
              <h2 className={`
                text-2xl font-bold mb-3
                ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Ask me anything
              </h2>
              <p className={`
                text-base mb-8
                ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
              `}>
                I'll search the web and provide comprehensive answers with sources
              </p>

              {/* Example Questions */}
              <div className="max-w-2xl mx-auto space-y-3">
                {[
                  'What is artificial intelligence?',
                  'How does photosynthesis work?',
                  'Tell me about the solar system',
                ].map((exampleQ, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(exampleQ)}
                    className={`
                      w-full text-left px-5 py-4 rounded-xl transition-all duration-200 
                      hover-lift touch-feedback
                      ${actualTheme === 'dark'
                        ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 text-gray-200'
                        : 'bg-white/80 hover:bg-white border border-purple-200/50 text-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💭</span>
                      <span className="flex-1 font-medium">{exampleQ}</span>
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <AIMessageCard
                key={message.id}
                message={message}
                onRelatedQuestionClick={handleRelatedQuestionClick}
                onRegenerateClick={
                  message.role === 'assistant' && index === messages.length - 1
                    ? handleRegenerate
                    : undefined
                }
              />
            ))}
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <AITypingIndicator message="AI is searching and generating an answer..." />
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <div className={`
              px-5 py-4 rounded-xl border-l-4 border-red-400 animate-slide-in-from-top
              ${actualTheme === 'dark'
                ? 'bg-red-900/20 border-red-500/50'
                : 'bg-red-50 border-red-400'
              }
            `}>
              <p className={`
                text-sm font-medium
                ${actualTheme === 'dark' ? 'text-red-300' : 'text-red-800'}
              `}>
                {error}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={`
        sticky bottom-0 backdrop-blur-lg border-t
        ${actualTheme === 'dark'
          ? 'bg-gray-900/80 border-gray-700/50'
          : 'bg-white/80 border-purple-200/50'
        }
        ${isMobile ? 'px-4 py-4' : 'px-6 py-4'}
      `}>
        <div className="max-w-4xl mx-auto">
          <div className={`
            flex items-end space-x-3 p-3 rounded-2xl transition-all duration-300
            ${actualTheme === 'dark'
              ? 'bg-gray-800/50 border border-gray-700/50'
              : 'bg-white border border-purple-200/50'
            }
          `}>
            <textarea
              ref={inputRef}
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              disabled={isLoading}
              className={`
                flex-1 bg-transparent outline-none resize-none overflow-hidden
                ${isMobile ? 'text-base' : 'text-base'}
                ${actualTheme === 'dark'
                  ? 'text-white placeholder-gray-400'
                  : 'text-gray-900 placeholder-gray-500'
                }
              `}
              rows={1}
              style={{ maxHeight: '150px' }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!query.trim() || isLoading}
              className={`
                flex-shrink-0 p-3 rounded-xl transition-all duration-200 hover-scale touch-feedback
                ${!query.trim() || isLoading
                  ? actualTheme === 'dark'
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-brand text-white shadow-lg hover:shadow-xl'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <p className={`
            text-xs text-center mt-2
            ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
          `}>
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIMode;

