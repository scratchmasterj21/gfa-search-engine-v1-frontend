import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { CheckIcon } from '../AnimatedIcons';
import AISourceCard from './AISourceCard';
import AIRelatedQuestions from './AIRelatedQuestions';
import type { AIMessage } from '../../types/aiChat';

interface AIMessageCardProps {
  message: AIMessage;
  onRelatedQuestionClick?: (question: string) => void;
  onRegenerateClick?: () => void;
}

const AIMessageCard: React.FC<AIMessageCardProps> = ({ 
  message, 
  onRelatedQuestionClick,
  onRegenerateClick 
}) => {
  const { actualTheme } = useTheme();
  const { isMobile } = useResponsive();
  const [copied, setCopied] = useState(false);

  // Parse a single line with inline formatting (bold, citations)
  const parseInlineFormatting = (text: string, keyPrefix: string = '') => {
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let partIndex = 0;

    // Process the text character by character to handle all inline formats
    while (currentText.length > 0) {
      // Check for citation [1], [2], etc.
      const citationMatch = currentText.match(/^\[(\d+)\]/);
      if (citationMatch) {
        const citationNum = parseInt(citationMatch[1]);
        const source = message.sources?.find(s => s.citationNumber === citationNum);
        
        parts.push(
          <a
            key={`${keyPrefix}-cite-${partIndex}`}
            href={source?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded
              transition-all duration-200 hover:scale-110 mx-0.5
              ${actualTheme === 'dark'
                ? 'bg-purple-600 text-white hover:bg-purple-500'
                : 'bg-gradient-brand text-white hover:shadow-lg'
              }
            `}
            title={source?.title || 'Source'}
          >
            {citationNum}
          </a>
        );
        currentText = currentText.slice(citationMatch[0].length);
        partIndex++;
        continue;
      }

      // Check for bold text **text**
      const boldMatch = currentText.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={`${keyPrefix}-bold-${partIndex}`} className="font-bold">
            {boldMatch[1]}
          </strong>
        );
        currentText = currentText.slice(boldMatch[0].length);
        partIndex++;
        continue;
      }

      // Regular text - collect until next special character
      const nextSpecial = currentText.search(/[\[\*]/);
      if (nextSpecial === -1) {
        // No more special characters, add remaining text
        if (currentText) {
          parts.push(<span key={`${keyPrefix}-text-${partIndex}`}>{currentText}</span>);
        }
        break;
      } else if (nextSpecial > 0) {
        // Add text up to next special character
        parts.push(
          <span key={`${keyPrefix}-text-${partIndex}`}>
            {currentText.slice(0, nextSpecial)}
          </span>
        );
        currentText = currentText.slice(nextSpecial);
        partIndex++;
      } else {
        // Special character at start but didn't match pattern, treat as regular text
        parts.push(<span key={`${keyPrefix}-text-${partIndex}`}>{currentText[0]}</span>);
        currentText = currentText.slice(1);
        partIndex++;
      }
    }

    return parts;
  };

  // Parse markdown table
  const parseTable = (lines: string[], startIndex: number): { table: React.ReactNode; endIndex: number } => {
    const tableLines: string[] = [];
    let idx = startIndex;

    // Collect all table lines
    while (idx < lines.length) {
      const line = lines[idx].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        tableLines.push(line);
        idx++;
      } else if (!line) {
        // Empty line might end the table
        idx++;
        break;
      } else {
        break;
      }
    }

    if (tableLines.length === 0) {
      return { table: null, endIndex: startIndex };
    }

    // Parse table structure
    const rows = tableLines.map(line => 
      line.split('|').slice(1, -1).map(cell => cell.trim())
    );

    // Identify header (first row) and separator (second row with dashes)
    const headerRow = rows[0];
    let dataRows = rows.slice(1);

    // Remove separator row if present (contains only dashes and colons)
    if (dataRows.length > 0 && dataRows[0].every(cell => /^[-:\s]+$/.test(cell))) {
      dataRows = dataRows.slice(1);
    }

    const table = (
      <div className="my-4 overflow-x-auto">
        <table className={`
          min-w-full border-collapse rounded-lg overflow-hidden
          ${actualTheme === 'dark' 
            ? 'bg-gray-800/50 border border-gray-700' 
            : 'bg-gray-50 border border-gray-200'
          }
        `}>
          <thead className={`
            ${actualTheme === 'dark' 
              ? 'bg-gray-700/50' 
              : 'bg-gray-100'
            }
          `}>
            <tr>
              {headerRow.map((cell, cellIdx) => (
                <th 
                  key={cellIdx}
                  className={`
                    px-4 py-3 text-left text-sm font-bold border-b-2
                    ${actualTheme === 'dark' 
                      ? 'text-gray-200 border-gray-600' 
                      : 'text-gray-700 border-gray-300'
                    }
                  `}
                >
                  {parseInlineFormatting(cell, `table-header-${cellIdx}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr 
                key={rowIdx}
                className={`
                  transition-colors duration-150
                  ${actualTheme === 'dark' 
                    ? 'hover:bg-gray-700/30' 
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                {row.map((cell, cellIdx) => (
                  <td 
                    key={cellIdx}
                    className={`
                      px-4 py-3 text-sm border-b
                      ${actualTheme === 'dark' 
                        ? 'text-gray-300 border-gray-700' 
                        : 'text-gray-700 border-gray-200'
                      }
                    `}
                  >
                    {parseInlineFormatting(cell, `table-cell-${rowIdx}-${cellIdx}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return { table, endIndex: idx };
  };

  // Parse markdown formatting and citations
  const parseFormattedAnswer = (text: string) => {
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let elementIndex = 0;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        i++;
        continue;
      }

      // Check if this is a table (starts and ends with |)
      if (line.startsWith('|') && line.endsWith('|')) {
        const { table, endIndex } = parseTable(lines, i);
        if (table) {
          elements.push(
            <div key={`table-${elementIndex}`}>
              {table}
            </div>
          );
          elementIndex++;
          i = endIndex;
          continue;
        }
      }

      // Check if this is the start of a bullet list
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const listItems: string[] = [];
        
        // Collect all consecutive bullet points
        while (i < lines.length) {
          const currentLine = lines[i].trim();
          if (currentLine.startsWith('* ') || currentLine.startsWith('- ')) {
            listItems.push(currentLine.replace(/^[*-]\s+/, ''));
            i++;
          } else if (!currentLine) {
            // Empty line, might be end of list
            i++;
            break;
          } else {
            // Not a bullet point or empty line, end of list
            break;
          }
        }

        // Render the list
        elements.push(
          <ul key={`list-${elementIndex}`} className="list-disc list-inside space-y-2 my-3 ml-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseInlineFormatting(item, `list-${elementIndex}-item-${idx}`)}
              </li>
            ))}
          </ul>
        );
        elementIndex++;
      } else {
        // Regular paragraph - collect until empty line or list or table
        const paragraphLines: string[] = [line];
        i++;

        while (i < lines.length) {
          const nextLine = lines[i].trim();
          if (!nextLine || nextLine.startsWith('* ') || nextLine.startsWith('- ') || 
              (nextLine.startsWith('|') && nextLine.endsWith('|'))) {
            break;
          }
          paragraphLines.push(nextLine);
          i++;
        }

        // Render paragraph
        elements.push(
          <p key={`para-${elementIndex}`} className="mb-4 leading-relaxed">
            {parseInlineFormatting(paragraphLines.join(' '), `para-${elementIndex}`)}
          </p>
        );
        elementIndex++;
      }
    }

    return elements;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // User message (simple)
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-slide-in-from-right">
        <div className={`
          max-w-[85%] px-5 py-3 rounded-2xl
          ${actualTheme === 'dark'
            ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
            : 'bg-gradient-brand text-white'
          }
        `}>
          <p className="text-sm font-medium leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // AI message (complex with sources)
  return (
    <div className="mb-6 animate-slide-in-from-left">
      <div className={`
        relative overflow-hidden rounded-2xl shadow-depth-3 transition-all duration-300
        ${actualTheme === 'dark'
          ? 'bg-gray-900/95 border border-gray-700/50'
          : 'bg-white/95 border border-purple-200/50'
        }
      `}>
        {/* Header */}
        <div className={`
          px-6 py-4 border-b flex items-center justify-between
          ${actualTheme === 'dark' ? 'border-gray-700/50' : 'border-purple-200/30'}
        `}>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse opacity-30"></div>
            </div>
            <div>
              <h3 className={`
                font-bold text-sm
                ${actualTheme === 'dark' ? 'text-purple-300' : 'text-purple-700'}
              `}>
                AI Answer
              </h3>
              {message.confidence && (
                <p className={`
                  text-xs
                  ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  Confidence: {(message.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Answer Content */}
        <div className="px-6 py-5">
          <div className={`
            prose prose-sm max-w-none
            ${actualTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}
          `}>
            {parseFormattedAnswer(message.content)}
          </div>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className={`
            px-6 py-4 border-t
            ${actualTheme === 'dark' ? 'border-gray-700/50' : 'border-purple-200/30'}
          `}>
            <h4 className={`
              font-semibold text-sm mb-3 flex items-center
              ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
            `}>
              <span className="mr-2">📚</span>
              Sources
            </h4>
            <div className="space-y-2">
              {message.sources.map((source, index) => (
                <AISourceCard key={source.id} source={source} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Related Questions */}
        {message.relatedQuestions && message.relatedQuestions.length > 0 && onRelatedQuestionClick && (
          <div className={`
            px-6 py-4 border-t
            ${actualTheme === 'dark' ? 'border-gray-700/50' : 'border-purple-200/30'}
          `}>
            <AIRelatedQuestions 
              questions={message.relatedQuestions}
              onQuestionClick={onRelatedQuestionClick}
            />
          </div>
        )}

        {/* Actions */}
        <div className={`
          px-6 py-4 border-t flex items-center justify-between
          ${actualTheme === 'dark' ? 'border-gray-700/50' : 'border-purple-200/30'}
        `}>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium 
                transition-all duration-200 hover-scale touch-feedback
                ${copied
                  ? 'bg-green-500 text-white'
                  : actualTheme === 'dark'
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
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
                  <span>{isMobile ? 'Copy' : 'Copy Answer'}</span>
                </>
              )}
            </button>

            {onRegenerateClick && (
              <button
                onClick={onRegenerateClick}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium 
                  transition-all duration-200 hover-scale touch-feedback
                  ${actualTheme === 'dark'
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isMobile ? 'Retry' : 'Regenerate'}</span>
              </button>
            )}
          </div>

          <div className={`
            text-xs
            ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
          `}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </div>
  );
};

export default AIMessageCard;

