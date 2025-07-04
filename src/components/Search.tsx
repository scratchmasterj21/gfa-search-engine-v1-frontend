import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { logSearch, getDeviceId } from './firebase'; // Import the logging function

interface SearchResult {
  title?: string;
  snippet?: string;
  link: string;
  thumbnail?: string;
  image?: string;
  source?: string;
}

interface Language {
  code: string;
  name: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiError {
  error?: {
    message?: string;
  };
}

// Define types for better type safety
type ConverterType = 'length' | 'weight' | 'temperature';
type LengthUnit = 'meters' | 'feet' | 'inches' | 'centimeters' | 'millimeters' | 'kilometers' | 'miles';
type WeightUnit = 'kilograms' | 'pounds' | 'grams' | 'ounces';
type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin';

interface LengthConversion {
  units: LengthUnit[];
  toMeters: Record<LengthUnit, number>;
}

interface WeightConversion {
  units: WeightUnit[];
  toKg: Record<WeightUnit, number>;
}

interface TemperatureConversion {
  units: TemperatureUnit[];
  convert: (value: number, from: TemperatureUnit, to: TemperatureUnit) => number;
}

interface Conversions {
  length: LengthConversion;
  weight: WeightConversion;
  temperature: TemperatureConversion;
}


const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialSearchType = (searchParams.get('searchType') as 'web' | 'image') || 'web';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchType, setSearchType] = useState<'web' | 'image'>(initialSearchType);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tabsVisible, setTabsVisible] = useState(initialQuery !== '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const suggestionsRef = useRef<HTMLUListElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [showMiniTool, setShowMiniTool] = useState<string | null>(null);

  // 2. Add this function to detect tool keywords (place it after your other functions):
const detectMiniTool = useCallback((searchQuery: string) => {
  const query = searchQuery.toLowerCase().trim();
  
  // Timer/Stopwatch keywords
  if (['timer', 'stopwatch', 'countdown', 'alarm'].some(keyword => query.includes(keyword))) {
    return 'timer';
  }
  
  // Calculator keywords
  if (['calculator', 'calculate', 'math', 'compute'].some(keyword => query.includes(keyword)) || 
      /[\d+\-*/()=]/.test(query)) {
    return 'calculator';
  }
  
  // Translator keywords
  if (['translate', 'translator', 'translation', 'language', '翻訳', 'ほんやく'].some(keyword => query.includes(keyword))) {
    return 'translator';
  }

   // Weather
  if (['weather', 'forecast', 'temperature', 'rain', 'sunny', 'cloudy'].some(keyword => query.includes(keyword))) {
    return 'weather';
  }
  
  // Color Picker
  if (['color', 'colour', 'picker', 'palette', 'hex', 'rgb'].some(keyword => query.includes(keyword))) {
    return 'colorpicker';
  }
  
  // QR Code Generator
  if (['qr', 'qr code', 'qrcode', 'barcode'].some(keyword => query.includes(keyword))) {
    return 'qrcode';
  }
  
  // Random Generator
  if (['random', 'dice', 'coin flip', 'lottery', 'number generator'].some(keyword => query.includes(keyword))) {
    return 'random';
  }
  
  // Password Generator
  if (['password', 'generate password', 'password generator', 'secure password'].some(keyword => query.includes(keyword))) {
    return 'password';
  }
  
  // Unit Converter
  if (['convert', 'converter', 'units', 'measurement', 'feet to meters', 'celsius', 'fahrenheit'].some(keyword => query.includes(keyword))) {
    return 'converter';
  }
  
  // Note Taking
  if (['note', 'notes', 'notepad', 'memo', 'write'].some(keyword => query.includes(keyword))) {
    return 'notes';
  }
  
  // BMI Calculator
  if (['bmi', 'body mass index', 'weight', 'height', 'fitness'].some(keyword => query.includes(keyword))) {
    return 'bmi';
  }
  
  // Age Calculator
  if (['age', 'birthday', 'how old', 'years old'].some(keyword => query.includes(keyword))) {
    return 'age';
  }
  
  return null;
}, []);


// 3. Mini Timer Component:
const MiniTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          if (mode === 'timer' && prevTime <= 1) {
            setIsRunning(false);
            return 0;
          }
          return mode === 'timer' ? prevTime - 1 : prevTime + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (mode === 'timer') {
      const totalSeconds = (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
      setTime(totalSeconds);
    }
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Timer & Stopwatch</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('timer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'timer' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Timer
          </button>
          <button
            onClick={() => setMode('stopwatch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'stopwatch' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Stopwatch
          </button>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
          {formatTime(time)}
        </div>
        
        {mode === 'timer' && !isRunning && (
          <div className="flex justify-center gap-2 mb-4">
            <input
              type="number"
              placeholder="MM"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(e.target.value)}
              className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono"
              min="0"
              max="99"
            />
            <span className="text-2xl font-bold text-gray-600 leading-10">:</span>
            <input
              type="number"
              placeholder="SS"
              value={inputSeconds}
              onChange={(e) => setInputSeconds(e.target.value)}
              className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono"
              min="0"
              max="59"
            />
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          <button
            onClick={isRunning ? () => setIsRunning(false) : startTimer}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Mini Calculator Component:
const MiniCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '*': return firstValue * secondValue;
      case '/': return firstValue / secondValue;
      case '=': return secondValue;
      default: return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const Button = ({ onClick, className, children }: any) => (
    <button
      onClick={onClick}
      className={`h-12 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Calculator</h3>
      
      <div className="bg-gray-900 text-white p-4 rounded-xl mb-4">
        <div className="text-right text-3xl font-mono overflow-hidden">
          {display}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <Button onClick={clear} className="bg-red-500 hover:bg-red-600 text-white col-span-2">
          Clear
        </Button>
        <Button onClick={() => inputOperation('/')} className="bg-orange-500 hover:bg-orange-600 text-white">
          ÷
        </Button>
        <Button onClick={() => inputOperation('*')} className="bg-orange-500 hover:bg-orange-600 text-white">
          ×
        </Button>
        
        <Button onClick={() => inputNumber('7')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          7
        </Button>
        <Button onClick={() => inputNumber('8')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          8
        </Button>
        <Button onClick={() => inputNumber('9')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          9
        </Button>
        <Button onClick={() => inputOperation('-')} className="bg-orange-500 hover:bg-orange-600 text-white">
          -
        </Button>
        
        <Button onClick={() => inputNumber('4')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          4
        </Button>
        <Button onClick={() => inputNumber('5')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          5
        </Button>
        <Button onClick={() => inputNumber('6')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          6
        </Button>
        <Button onClick={() => inputOperation('+')} className="bg-orange-500 hover:bg-orange-600 text-white">
          +
        </Button>
        
        <Button onClick={() => inputNumber('1')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          1
        </Button>
        <Button onClick={() => inputNumber('2')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          2
        </Button>
        <Button onClick={() => inputNumber('3')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          3
        </Button>
        <Button onClick={performCalculation} className="bg-purple-600 hover:bg-purple-700 text-white row-span-2">
          =
        </Button>
        
        <Button onClick={() => inputNumber('0')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 col-span-2">
          0
        </Button>
        <Button onClick={() => inputNumber('.')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          .
        </Button>
      </div>
    </div>
  );
};

const MiniTranslator = () => {
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>('ja');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [currentKeyIndex, setCurrentKeyIndex] = useState<number>(0);
  const [keyStatus, setKeyStatus] = useState<{[key: number]: {
    isBlocked: boolean;
    blockedUntil: number;
    lastUsed: number;
    requestCount: number;
    windowStart: number;
  }}>({});

  const languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: 'Japanese' },
  ];

  // Rate limit configurations (conservative estimates for Gemini free tier)
  const RATE_LIMITS = {
    RPM: 30, // Requests per minute
    COOLDOWN_MINUTES: 1, // How long to wait before retrying a rate-limited key
    WINDOW_MINUTES: 1, // Time window for counting requests
  };

  // Get all API keys from environment variables
  const getApiKeys = (): string[] => {
    const keys: string[] = [];
    
    const keyVariations = [
      'VITE_APP_GEMINI_API_KEY',
      'VITE_APP_GEMINI_API_KEY_1',
      'VITE_APP_GEMINI_API_KEY_2',
      'VITE_APP_GEMINI_API_KEY_3',
      'VITE_APP_GEMINI_API_KEY_4',
      'VITE_APP_GEMINI_API_KEY_5',
      // Add more as needed
      'VITE_APP_GEMINI_API_KEY_6',
      'VITE_APP_GEMINI_API_KEY_7',
      'VITE_APP_GEMINI_API_KEY_8',
      'VITE_APP_GEMINI_API_KEY_9'
    ];

    keyVariations.forEach(keyName => {
      const key = import.meta.env[keyName];
      if (key && key.trim()) {
        keys.push(key.trim());
      }
    });

    return keys;
  };

  const apiKeys = getApiKeys();

  const getLanguageName = (code: string): string => {
    return languages.find((lang: Language) => lang.code === code)?.name || code;
  };

  // Initialize key status
  const initializeKeyStatus = (keyIndex: number) => {
    if (!keyStatus[keyIndex]) {
      setKeyStatus(prev => ({
        ...prev,
        [keyIndex]: {
          isBlocked: false,
          blockedUntil: 0,
          lastUsed: 0,
          requestCount: 0,
          windowStart: Date.now(),
        }
      }));
    }
  };

  // Check if a key is available to use
  const isKeyAvailable = (keyIndex: number): boolean => {
    const now = Date.now();
    const status = keyStatus[keyIndex];
    
    if (!status) return true; // Key not used yet
    
    // Check if cooldown period has passed
    if (status.isBlocked && now >= status.blockedUntil) {
      return true;
    }
    
    if (status.isBlocked) return false;
    
    // Check request count in current window
    const windowElapsed = now - status.windowStart;
    if (windowElapsed >= RATE_LIMITS.WINDOW_MINUTES * 60 * 1000) {
      return true; // Window has reset
    }
    
    return status.requestCount < RATE_LIMITS.RPM;
  };

  // Update key status after use
  const updateKeyStatus = (keyIndex: number, wasRateLimited: boolean) => {
    const now = Date.now();
    
    setKeyStatus(prev => {
      const currentStatus = prev[keyIndex] || {
        isBlocked: false,
        blockedUntil: 0,
        lastUsed: 0,
        requestCount: 0,
        windowStart: now,
      };
      
      // Reset window if needed
      const windowElapsed = now - currentStatus.windowStart;
      let newRequestCount = currentStatus.requestCount;
      let newWindowStart = currentStatus.windowStart;
      
      if (windowElapsed >= RATE_LIMITS.WINDOW_MINUTES * 60 * 1000) {
        newRequestCount = 0;
        newWindowStart = now;
      }
      
      return {
        ...prev,
        [keyIndex]: {
          isBlocked: wasRateLimited,
          blockedUntil: wasRateLimited ? now + (RATE_LIMITS.COOLDOWN_MINUTES * 60 * 1000) : 0,
          lastUsed: now,
          requestCount: newRequestCount + 1,
          windowStart: newWindowStart,
        }
      };
    });
  };

  // Get next available key
  const getNextAvailableKey = (): number | null => {
    // First, try current key if it's available
    if (isKeyAvailable(currentKeyIndex)) {
      return currentKeyIndex;
    }
    
    // Then try all other keys
    for (let i = 0; i < apiKeys.length; i++) {
      if (isKeyAvailable(i)) {
        return i;
      }
    }
    
    return null; // No keys available
  };

  // Get status summary for UI
  const getKeyStatusSummary = () => {
    const now = Date.now();
    let available = 0;
    let blocked = 0;
    let nearLimit = 0;
    
    for (let i = 0; i < apiKeys.length; i++) {
      const status = keyStatus[i];
      if (!status) {
        available++;
        continue;
      }
      
      if (status.isBlocked && now < status.blockedUntil) {
        blocked++;
      } else if (status.requestCount >= RATE_LIMITS.RPM * 0.8) {
        nearLimit++;
      } else {
        available++;
      }
    }
    
    return { available, blocked, nearLimit };
  };

  const translateWithKey = async (apiKey: string): Promise<string> => {
    const prompt: string = `Translate the following text from ${getLanguageName(sourceLang)} to ${getLanguageName(targetLang)}. Return only the translation, no explanations or additional text:

"${sourceText}"`;

    const response: Response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorData: GeminiError = await response.json();
      const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
      
      // Check if it's a rate limit error
      if (errorMessage.includes('QUOTA_EXCEEDED') || 
          errorMessage.includes('RATE_LIMIT_EXCEEDED') ||
          errorMessage.includes('Too Many Requests') ||
          response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      
      throw new Error(errorMessage);
    }
    
    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const translation: string | undefined = data.candidates[0].content.parts?.[0]?.text;
      if (translation) {
        return translation.trim().replace(/^["']|["']$/g, '');
      } else {
        throw new Error('No translation text received from Gemini');
      }
    } else {
      throw new Error('No translation received from Gemini');
    }
  };

  const translateText = async (): Promise<void> => {
    if (!sourceText.trim()) return;
    
    if (apiKeys.length === 0) {
      setTranslatedText('No API keys found. Please set VITE_APP_GEMINI_API_KEY (and optionally VITE_APP_GEMINI_API_KEY_1, VITE_APP_GEMINI_API_KEY_2, etc.) in your environment variables.');
      return;
    }
    
    setIsTranslating(true);
    
    // Initialize all key statuses
    for (let i = 0; i < apiKeys.length; i++) {
      initializeKeyStatus(i);
    }
    
    const availableKeyIndex = getNextAvailableKey();
    
    if (availableKeyIndex === null) {
      const statusSummary = getKeyStatusSummary();
      const oldestBlockedKey = Object.entries(keyStatus)
        .filter(([_, status]) => status.isBlocked)
        .sort(([_, a], [__, b]) => a.blockedUntil - b.blockedUntil)[0];
      
      const waitTime = oldestBlockedKey 
        ? Math.ceil((oldestBlockedKey[1].blockedUntil - Date.now()) / 1000)
        : 60;
      
      setTranslatedText(`All ${apiKeys.length} API keys are currently rate-limited. Next key available in ~${waitTime}s. Status: ${statusSummary.blocked} blocked, ${statusSummary.nearLimit} near limit.`);
      setIsTranslating(false);
      return;
    }
    
    try {
      console.log(`Using API key ${availableKeyIndex + 1}/${apiKeys.length}`);
      
      const apiKey = apiKeys[availableKeyIndex];
      const translation = await translateWithKey(apiKey);
      
      // Mark key as used successfully
      updateKeyStatus(availableKeyIndex, false);
      setCurrentKeyIndex(availableKeyIndex);
      setTranslatedText(translation);
      
      console.log('Translation completed successfully');
      
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn(`API key ${availableKeyIndex + 1} failed:`, errorMessage);
      
      if (errorMessage === 'RATE_LIMIT') {
        // Mark this key as rate-limited and try another
        updateKeyStatus(availableKeyIndex, true);
        
        // Try to find another available key
        const nextKeyIndex = getNextAvailableKey();
        if (nextKeyIndex !== null && nextKeyIndex !== availableKeyIndex) {
          console.log(`Retrying with API key ${nextKeyIndex + 1}/${apiKeys.length}`);
          setIsTranslating(false);
          setTimeout(() => translateText(), 100); // Small delay before retry
          return;
        } else {
          const statusSummary = getKeyStatusSummary();
          setTranslatedText(`API key ${availableKeyIndex + 1} hit rate limit. All keys currently rate-limited. Status: ${statusSummary.blocked} blocked, ${statusSummary.available} available.`);
        }
      } else {
        // Handle other errors
        if (errorMessage.includes('API_KEY_INVALID')) {
          setTranslatedText(`Invalid API key ${availableKeyIndex + 1}. Please check your Gemini API keys in environment variables.`);
        } else {
          setTranslatedText(`Translation failed: ${errorMessage}`);
        }
      }
    }
    
    setIsTranslating(false);
  };

  const swapLanguages = (): void => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setSourceText(e.target.value);
  };

  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSourceLang(e.target.value);
  };

  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setTargetLang(e.target.value);
  };

  const statusSummary = getKeyStatusSummary();

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Google Translate
        {apiKeys.length > 1 && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({apiKeys.length} keys: {statusSummary.available} available, {statusSummary.blocked} cooling down)
          </span>
        )}
      </h3>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <select
            value={sourceLang}
            onChange={handleSourceLangChange}
            className="w-full p-2 border border-gray-300 rounded-lg mb-2"
          >
            {languages.map((lang: Language) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <textarea
            value={sourceText}
            onChange={handleSourceTextChange}
            placeholder="Enter text to translate..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
          />
        </div>
        
        <div className="flex md:flex-col items-center justify-center gap-2">
          <button
            onClick={swapLanguages}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
            title="Swap languages"
            type="button"
          >
            ⇄
          </button>
        </div>
        
        <div className="flex-1">
          <select
            value={targetLang}
            onChange={handleTargetLangChange}
            className="w-full p-2 border border-gray-300 rounded-lg mb-2"
          >
            {languages.map((lang: Language) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <div className="w-full h-32 p-3 border border-gray-300 rounded-lg bg-gray-50 overflow-auto">
            {isTranslating ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  Translating...
                  {apiKeys.length > 1 && ` (${statusSummary.available}/${apiKeys.length} keys ready)`}
                </span>
              </div>
            ) : (
              <p className="text-gray-800">{translatedText}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={translateText}
          disabled={!sourceText.trim() || isTranslating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all"
          type="button"
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </button>
      </div>
    </div>
  );
};

const MiniColorPicker: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState<string>('#3b82f6');
  const [colorHistory, setColorHistory] = useState<string[]>(['#3b82f6', '#ef4444', '#10b981', '#f59e0b']);

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 'rgb(0, 0, 0)';
  };

  const addToHistory = (color: string): void => {
    if (!colorHistory.includes(color)) {
      setColorHistory(prev => [color, ...prev.slice(0, 7)]);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    addToHistory(newColor);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedColor(e.target.value);
  };

  const handleHistoryColorClick = (color: string): void => {
    setSelectedColor(color);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Color Picker</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <div 
              className="w-full h-32 rounded-xl border-2 border-gray-300 mb-4 shadow-inner"
              style={{ backgroundColor: selectedColor }}
            />
            <input 
              type="color" 
              value={selectedColor} 
              onChange={handleColorChange}
              className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer" 
            />
          </div>
        </div>
        <div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HEX</label>
              <input 
                type="text" 
                value={selectedColor} 
                onChange={handleHexInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RGB</label>
              <input 
                type="text" 
                value={hexToRgb(selectedColor)} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono bg-gray-50" 
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recent Colors</label>
            <div className="grid grid-cols-4 gap-2">
              {colorHistory.map((color: string, index: number) => (
                <button 
                  key={index} 
                  onClick={() => handleHistoryColorClick(color)}
                  className="w-full h-8 rounded-lg border border-gray-300 hover:scale-110 transition-transform" 
                  style={{ backgroundColor: color }} 
                  title={color} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniConverter = () => {
  const [converterType, setConverterType] = useState<ConverterType>('length');
  const [fromUnit, setFromUnit] = useState<string>('meters');
  const [toUnit, setToUnit] = useState<string>('feet');
  const [inputValue, setInputValue] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [resultFromUnit, setResultFromUnit] = useState<string>('');
  const [resultToUnit, setResultToUnit] = useState<string>('');

  const conversions: Conversions = {
    length: {
      units: ['meters', 'feet', 'inches', 'centimeters', 'millimeters', 'kilometers', 'miles'],
      toMeters: {
        meters: 1,
        feet: 0.3048,
        inches: 0.0254,
        centimeters: 0.01,
        millimeters: 0.001,
        kilometers: 1000,
        miles: 1609.34
      }
    },
    weight: {
      units: ['kilograms', 'pounds', 'grams', 'ounces'],
      toKg: {
        kilograms: 1,
        pounds: 0.453592,
        grams: 0.001,
        ounces: 0.0283495
      }
    },
    temperature: {
      units: ['celsius', 'fahrenheit', 'kelvin'],
      convert: (value: number, from: TemperatureUnit, to: TemperatureUnit): number => {
        if (from === to) return value;
        
        // Convert to Celsius first
        let celsius = value;
        if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
        if (from === 'kelvin') celsius = value - 273.15;
        
        // Convert from Celsius to target
        if (to === 'fahrenheit') return celsius * 9/5 + 32;
        if (to === 'kelvin') return celsius + 273.15;
        return celsius;
      }
    }
  };

  const convert = () => {
    if (!inputValue) return;
    
    const value = parseFloat(inputValue);
    if (isNaN(value)) return;
    
    let converted = 0;
    
    if (converterType === 'temperature') {
      converted = conversions.temperature.convert(
        value, 
        fromUnit as TemperatureUnit, 
        toUnit as TemperatureUnit
      );
    } else {
      const conversionData = conversions[converterType];
      const baseKey = converterType === 'length' ? 'toMeters' : 'toKg';
      const baseUnit = (conversionData as any)[baseKey] as Record<string, number>;
      const baseValue = value * baseUnit[fromUnit];
      converted = baseValue / baseUnit[toUnit];
    }
    
    setResult(converted.toFixed(4));
    setResultFromUnit(fromUnit);
    setResultToUnit(toUnit);
  };

  const handleConverterTypeChange = (newType: ConverterType) => {
    setConverterType(newType);
    const newConversion = conversions[newType];
    setFromUnit(newConversion.units[0]);
    setToUnit(newConversion.units[1] || newConversion.units[0]);
    setResult('');
  };

  const getCurrentUnits = (): string[] => {
    return conversions[converterType].units;
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Unit Converter</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={converterType}
            onChange={(e) => handleConverterTypeChange(e.target.value as ConverterType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="length">Length</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {getCurrentUnits().map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {getCurrentUnits().map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && convert()}
            placeholder="Enter value to convert"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <button
          onClick={convert}
          className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all"
        >
          Convert
        </button>
        
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-green-800">
                {inputValue} {resultFromUnit} = {result} {resultToUnit}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  // Initialize device ID on component mount
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    console.log('Device ID:', deviceId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create a helper function that accepts the query as a parameter
  const performSearchWithQuery = useCallback(async (searchQuery: string, page: number, isLoadMore = false) => {
    if (!searchQuery) return;

    // Prevent multiple simultaneous requests using state
    if (loading || loadingMore) {
      console.log('Already loading, skipping request');
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    setErrorMessage(null);

    try {
      const startIndex = (page - 1) * 10 + 1;
      
      // Update URL only for new searches, not for load more
      if (!isLoadMore) {
        setSearchParams({ query: searchQuery, searchType });
      }

      const detectedTool = detectMiniTool(searchQuery);
      setShowMiniTool(detectedTool);


      // Google Custom Search API limits to 100 total results
      // Last valid start index is 91 (results 91-100)
      if (startIndex > 91) {
        console.log('Reached API limit - no more results available');
        setHasMore(false);
        return;
      }

      console.log(`Fetching page ${page}, startIndex: ${startIndex}`);

      const response = await axios.get<{ items: any[] }>(
        `https://backend.carlo587-jcl.workers.dev/search`,
        {
          params: {
            query: searchQuery,
            searchType: searchType,
            start: startIndex,
          },
        }
      );

      const originalResults = response.data.items || [];
      console.log(`Received ${originalResults.length} results for page ${page}`);

      // If we get no results, we've reached the end
      if (originalResults.length === 0) {
        console.log('No results returned - reached end');
        setHasMore(false);
        return;
      }
      
      // Calculate total results after this page
      const totalResultsAfterThisPage = (page - 1) * 10 + originalResults.length;
      
      // Determine if there are more results
      let hasMoreResults = true;
      
      if (totalResultsAfterThisPage >= 100) {
        // Reached Google's 100 result limit
        console.log('Reached 100 result limit');
        hasMoreResults = false;
      } else if (originalResults.length === 0) {
        // If we get 0 results, we've definitely reached the end
        console.log('No results returned - reached end');
        hasMoreResults = false;
      } else {
        // If we get any results, assume there might be more
        // The only way to know for sure is to try the next page
        // We'll only stop when we get 0 results or hit the 100 limit
        console.log(`Page ${page}: Received ${originalResults.length} results - continuing`);
        hasMoreResults = true;
      }
      
      setHasMore(hasMoreResults);

      const formattedResults = originalResults.map((item) => ({
        title: searchType === 'web' ? item.title : undefined,
        snippet: searchType === 'web' ? item.snippet : undefined,
        link: item.link,
        thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.link,
        image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.link,
        source: new URL(item.link).hostname,
      }));
      
      if (isLoadMore) {
        // Append new results to existing ones
        setResults(prevResults => {
          const newResults = [...prevResults, ...formattedResults];
          console.log(`Total results after append: ${newResults.length}`);
          return newResults;
        });
      } else {
        // Replace results for new search
        setResults(formattedResults);
        console.log(`Set initial results: ${formattedResults.length}`);
      }

      // Log the search to Firebase (only for new searches, not pagination)
      await logSearch(searchQuery, searchType, originalResults);
    

    } catch (error) {
      console.error('Search error:', error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.error || error.message || 'An unexpected error occurred.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred.');
      }
      
      // If it's a load more error, don't show it prominently
      if (isLoadMore) {
        setHasMore(false);
        console.log('Load more failed - setting hasMore to false');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchType, loading, loadingMore, setSearchParams]);

  // Update the original performSearch to use the new helper
  const performSearch = useCallback(async (page: number, isLoadMore = false) => {
    return performSearchWithQuery(query, page, isLoadMore);
  }, [query, performSearchWithQuery]);

  const loadMoreResults = useCallback(() => {
    if (!hasMore || loading || loadingMore) {
      console.log('Load more cancelled - hasMore:', hasMore, 'loading:', loading, 'loadingMore:', loadingMore);
      return;
    }
    
    const nextPage = currentPage + 1;
    console.log('Loading more results - page:', nextPage);
    setCurrentPage(nextPage);
    performSearch(nextPage, true);
  }, [currentPage, hasMore, loading, loadingMore, performSearch]);

  // Intersection Observer for infinite scroll - Fixed useEffect
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        console.log('Intersection observed:', {
          isIntersecting: target.isIntersecting,
          hasMore,
          loading,
          loadingMore,
          resultsLength: results.length
        });
        
        if (target.isIntersecting && hasMore && !loading && !loadingMore && results.length > 0) {
          console.log('Triggering load more from intersection observer');
          loadMoreResults();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    // Attach observer to the load more element
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
      console.log('Observer attached to load more element');
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, results.length, loading, loadingMore, loadMoreResults]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [searchType]);

  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);

    if (e.target.value.trim() === '') {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await axios.get('https://auto-suggest-queries.p.rapidapi.com/suggestqueries', {
        params: { query: e.target.value },
        headers: {
          'X-RapidAPI-Key': import.meta.env.VITE_APP_RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': import.meta.env.VITE_APP_RAPIDAPI_HOST || ''
        }
      });
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching auto-suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    console.log('Starting new search for:', query);
    setCurrentPage(1);
    setHasMore(true);
    setResults([]);
    performSearch(1, false);
  }, [query, performSearch]);

  const handleSearchClick = () => {
    setTabsVisible(true);
    setSuggestions([]);
    handleSearch();
  };

  const handleSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setTabsVisible(true);
      setSuggestions([]);
      handleSearch();
    }
  };

  const handleTabChange = (type: 'web' | 'image') => {
    console.log('Changing search type to:', type);
    setSearchType(type);
    setCurrentPage(1);
    setHasMore(true);
    setResults([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setTabsVisible(true);
    setSuggestions([]); // Clear suggestions immediately
    
    // Use the suggestion directly instead of relying on state
    console.log('Starting new search for suggestion:', suggestion);
    setCurrentPage(1);
    setHasMore(true);
    setResults([]);
    
    // Call performSearchWithQuery with the suggestion directly
    performSearchWithQuery(suggestion, 1, false);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed px-4 py-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `url('https://i.imgur.com/G20z4MI.png')` }}
    >

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>



      <div className="relative z-10">
        {/* Logo Container */}
        <div className="flex justify-center pt-6 pb-8">
          <a href="/" className="block group">
            <div className="relative">
              <img 
                src="https://i.imgur.com/QTNsUY1.png" 
                alt="Google Logo" 
                className="h-16 w-auto sm:h-20 md:h-24 lg:h-28 cursor-pointer transition-all duration-300 group-hover:scale-110 drop-shadow-2xl" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            </div>
          </a>
        </div>

        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4">
          {/* Search Section */}
          <div className="relative mb-8">
            {/* Search Bar Container */}
            <div className="max-w-2xl mx-auto relative">
              <div className={`flex items-stretch bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 border border-white/20 ${searchFocused ? 'ring-2 ring-purple-400/50 shadow-purple-500/30' : ''}`}>
                <div className="flex items-center pl-6">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleSearchOnEnter}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search the universe..."
                  className="flex-1 outline-none text-base sm:text-lg px-4 py-4 bg-transparent placeholder-gray-500 text-gray-800 font-medium"
                />
                <button
                  onClick={handleSearchClick}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 rounded-r-2xl transition-all duration-300 font-semibold whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <span className="hidden sm:inline flex items-center">
                    Search
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className="sm:hidden text-lg">🚀</span>
                </button>
              </div>

              {/* Auto-suggestions Dropdown */}
              {suggestions.length > 0 && !suggestionsLoading && (
                <ul
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-6 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-cyan-50 transition-all duration-200 border-b border-gray-100/50 last:border-b-0 text-gray-800 font-medium first:rounded-t-2xl last:rounded-b-2xl group"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <span className="group-hover:text-purple-700 transition-colors duration-200">{suggestion}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              {suggestionsLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 text-center text-gray-600 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600 mr-3"></div>
                    <span className="font-medium">Finding suggestions...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Type Tabs */}
          {tabsVisible && (
            <div className="flex justify-center mb-8 animate-in slide-in-from-bottom-3 duration-300">
              <div className="flex bg-white/20 backdrop-blur-md rounded-2xl shadow-xl p-1.5 border border-white/30">
                <button
                  className={`flex items-center py-3 px-8 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 ${
                    searchType === 'web' 
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg transform scale-105' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleTabChange('web')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  Web
                </button>
                <button
                  className={`flex items-center py-3 px-8 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 ${
                    searchType === 'image' 
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg transform scale-105' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleTabChange('image')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Images
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16 animate-in fade-in duration-300">
              <div className="inline-flex flex-col items-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-purple-500 mb-6"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400/50"></div>
                </div>
                <span className="text-white font-bold text-xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Searching the cosmos...
                </span>
                <div className="mt-2 flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="max-w-2xl mx-auto mb-8 animate-in slide-in-from-top-3 duration-300">
              <div className="bg-red-500/20 backdrop-blur-md border-l-4 border-red-400 p-6 rounded-r-2xl shadow-xl border border-red-200/30">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-red-300 font-bold text-lg">Houston, we have a problem</p>
                    <p className="text-red-200 text-sm mt-1 font-medium">{errorMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
{/* Mini Tools */}
{showMiniTool && (
  <div className="animate-in slide-in-from-top-3 duration-500">
    {showMiniTool === 'timer' && <MiniTimer />}
    {showMiniTool === 'calculator' && <MiniCalculator />}
    {showMiniTool === 'translator' && <MiniTranslator />}
    {showMiniTool === 'colorpicker' && <MiniColorPicker />}
    {showMiniTool === 'converter' && <MiniConverter />}

  </div>
)}
          {/* Search Results */}
          {results.length > 0 && !loading && (
            <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
              {searchType === 'web' ? (
                /* Web Results */
                <div className="space-y-6 max-w-4xl mx-auto">
                  {results.map((item, index) => (
                    <div 
                      key={`${item.link}-${index}`} 
                      className="bg-white/95 backdrop-blur-md hover:bg-white border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden group hover:border-purple-300/50 transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {item.thumbnail && (
                            <div className="flex-shrink-0 order-1 lg:order-none">
                              <div className="relative overflow-hidden rounded-xl group-hover:scale-105 transition-transform duration-300">
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full lg:w-36 lg:h-36 h-48 object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="mb-3 flex items-center">
                              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3 animate-pulse"></div>
                              <p className="text-emerald-600 text-sm font-bold truncate bg-emerald-50 px-3 py-1 rounded-full">
                                {item.source}
                              </p>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 hover:text-purple-600 transition-colors duration-300 mb-4 leading-tight group-hover:text-purple-700">
                              <a 
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline decoration-purple-400 decoration-2 underline-offset-4"
                              >
                                {item.title}
                              </a>
                            </h3>
                            <p className="text-gray-600 leading-relaxed line-clamp-3 font-medium">
                              {item.snippet}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Image Results */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {results.map((item, index) => (
                    <button 
                      key={`${item.link}-${index}`} 
                      onClick={() => setSelectedImage(item)}
                      className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-105 bg-white/95 backdrop-blur-md border border-white/20 hover:border-purple-300/50 animate-in zoom-in duration-200"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="aspect-square p-2">
                        <img
                          src={item.image}
                          alt={item.title || 'Search result image'}
                          className="w-full h-full object-cover rounded-xl group-hover:brightness-110 transition-all duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        <div className="absolute bottom-2 left-2 right-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                            <p className="text-xs font-medium text-gray-800 truncate">View Image</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Load More Trigger & Loading More Indicator */}
          {results.length > 0 && !loading && (
            <div ref={loadMoreRef} className="text-center py-12">
              {loadingMore && (
                <div className="inline-flex flex-col items-center animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/30 border-t-cyan-500 mb-4"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border-4 border-cyan-400/50"></div>
                  </div>
                  <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Loading more results...</span>
                </div>
              )}
              {!hasMore && !loadingMore && (
                <div className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl inline-block border border-white/30 shadow-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-bold">
                      {results.length >= 100 ? 'Reached maximum results (100)' : 'No more results found'}
                    </span>
                  </div>
                </div>
              )}
              {hasMore && !loadingMore && (
                <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl inline-block border border-white/20 shadow-lg animate-pulse">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="font-medium text-sm">Scroll for more cosmic discoveries</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

{/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden relative animate-in zoom-in duration-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg hover:scale-110"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
              
              {/* Image Container - Takes up most of the modal space */}
              <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                <img 
                  src={selectedImage.image} 
                  alt="Full-size preview" 
                  className="max-w-full max-h-full object-contain shadow-lg"
                  style={{ 
                    minHeight: '200px', // Ensure minimum height for very small images
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating elements for extra visual flair */}
        <div className="fixed bottom-8 right-8 z-40">
          {results.length > 0 && (
            <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/30 shadow-lg animate-in slide-in-from-bottom-5 duration-500">
              <div className="flex items-center text-sm font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                {results.length} results found
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;