// AI Service for Gemini API integration
interface AIResponse {
  answer: string;
  sources: string[];
  confidence: number;
  query: string;
  timestamp: Date;
}

interface CachedAIResponse extends AIResponse {
  cachedAt: Date;
  expiresAt: Date;
}

class AIService {
  private cache: Map<string, CachedAIResponse> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly MAX_CACHE_SIZE = 100;

  // AI-worthy query patterns (English)
  private readonly aiKeywords = [
    'what is', 'who is', 'when did', 'where is', 'why does', 'why is',
    'how to', 'how does', 'how can', 'how do', 'how are', 'how was',
    'explain', 'define', 'compare', 'difference between', 'best way to',
    'pros and cons', 'advantages and disadvantages', 'what are the',
    'tell me about', 'describe', 'summarize', 'overview of'
  ];

  // AI-worthy query patterns (Japanese)
  private readonly aiKeywordsJapanese = [
    'とは', 'とは何', 'とは何ですか', 'とは何でしょうか', 'とは何か',
    '誰', 'いつ', 'どこ', 'なぜ', 'どうして', 'どのように', 'どうやって',
    '説明', '定義', '比較', '違い', '違いは', '違いについて',
    '方法', 'やり方', '仕方', '手順', '手順は', '手順について',
    '教えて', '教えてください', '教えて下さい', '教えてもらえますか',
    'について', 'について教えて', 'について説明', 'について詳しく',
    'まとめ', '要約', '概要', '概要を', '概要について',
    'メリット', 'デメリット', '利点', '欠点', '長所', '短所',
    'おすすめ', 'お勧め', '推奨', 'ベスト', '最適', '最良'
  ];

  private readonly questionWords = ['what', 'who', 'when', 'where', 'why', 'how'];
  
  // Japanese question particles and words
  private readonly questionWordsJapanese = ['何', '誰', 'いつ', 'どこ', 'なぜ', 'どうして', 'どの', 'どれ', 'どちら'];
  private readonly skipPatterns = [
    /^site:/i,
    /^filetype:/i,
    /^intitle:/i,
    /^inurl:/i,
    /^related:/i,
    /^cache:/i
  ];

  // Get all API keys from environment variables
  private getApiKeys(): string[] {
    const keys: string[] = [];
    
    const keyVariations = [
      'VITE_APP_GEMINI_API_KEY',
      'VITE_APP_GEMINI_API_KEY_1',
      'VITE_APP_GEMINI_API_KEY_2',
      'VITE_APP_GEMINI_API_KEY_3',
      'VITE_APP_GEMINI_API_KEY_4',
      'VITE_APP_GEMINI_API_KEY_5',
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
  }

  // Detect if query contains Japanese characters
  private isJapaneseQuery(query: string): boolean {
    // Check for Hiragana, Katakana, or Kanji characters
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    return japaneseRegex.test(query);
  }

  // Check if query contains adult content
  private containsAdultContent(query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    const originalQuery = query.trim();
    
    // English adult content keywords
    const adultKeywordsEnglish = [
      'porn', 'pornography', 'sex', 'sexual', 'nude', 'naked', 'breast', 'boob', 'boobs',
      'penis', 'vagina', 'orgasm', 'masturbat', 'fetish', 'bdsm', 'xxx', 'adult',
      'erotic', 'intimate', 'genital', 'explicit', 'nsfw', 'hentai', 'ecchi'
    ];
    
    // Japanese adult content keywords
    const adultKeywordsJapanese = [
      'おパイ', 'おっぱい', 'パイ', 'ちんこ', 'まんこ', 'エッチ', 'エロ', 'ポルノ',
      'アダルト', 'AV', 'アブノーマル', '変態', '痴漢', 'レイプ', 'SM', 'BDSM',
      'フェチ', 'コスプレ', 'ロリ', 'ショタ', '巨乳', '貧乳', '美少女', '美少年',
      'セックス', '性交', '性行為', '自慰', 'オナニー', 'マスターベーション',
      '裸', 'ヌード', '下着', 'パンツ', 'ブラジャー', '乳首', '陰部', '性器'
    ];
    
    // Check for English adult keywords
    const hasEnglishAdultContent = adultKeywordsEnglish.some(keyword => 
      normalizedQuery.includes(keyword)
    );
    
    // Check for Japanese adult keywords
    const hasJapaneseAdultContent = adultKeywordsJapanese.some(keyword => 
      originalQuery.includes(keyword)
    );
    
    return hasEnglishAdultContent || hasJapaneseAdultContent;
  }

  // Check if query should trigger AI response
  shouldUseAI(query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    const originalQuery = query.trim();
    
    // Skip if query is too short
    if (normalizedQuery.length < 2) return false;
    
    // Skip if query contains adult content
    if (this.containsAdultContent(query)) {
      return false;
    }
    
    // Skip if query has special operators
    if (this.skipPatterns.some(pattern => pattern.test(normalizedQuery))) {
      return false;
    }
    
    // Skip if query is just a URL or domain
    if (/^https?:\/\//.test(normalizedQuery) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedQuery)) {
      return false;
    }
    
    // Check for AI-worthy keywords (English)
    const hasAIKeywords = this.aiKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
    
    // Check for AI-worthy keywords (Japanese)
    const hasAIKeywordsJapanese = this.aiKeywordsJapanese.some(keyword => 
      originalQuery.includes(keyword)
    );
    
    // Check for question words at the beginning (English)
    const startsWithQuestion = this.questionWords.some(word => 
      normalizedQuery.startsWith(word + ' ')
    );
    
    // Check for question words (Japanese)
    const hasJapaneseQuestionWords = this.questionWordsJapanese.some(word => 
      originalQuery.includes(word)
    );
    
    // Check for question mark
    const hasQuestionMark = normalizedQuery.includes('?') || originalQuery.includes('？');
    
    // Check for comparison words (English)
    const hasComparisonWords = ['vs', 'versus', 'compared to', 'better than', 'worse than'].some(word =>
      normalizedQuery.includes(word)
    );
    
    // Check for comparison words (Japanese)
    const hasJapaneseComparisonWords = ['対', '比較', '違い', 'どちら', 'どっち', 'vs', 'VS'].some(word =>
      originalQuery.includes(word)
    );
    
    // Check for Japanese question particles
    const hasJapaneseQuestionParticles = ['か', 'ですか', 'でしょうか', 'ですか？', 'でしょうか？'].some(particle =>
      originalQuery.endsWith(particle)
    );
    
    return hasAIKeywords || hasAIKeywordsJapanese || startsWithQuestion || hasJapaneseQuestionWords || 
           hasQuestionMark || hasComparisonWords || hasJapaneseComparisonWords || hasJapaneseQuestionParticles;
  }

  // Get cached response if available
  private getCachedResponse(query: string): AIResponse | null {
    const cached = this.cache.get(query.toLowerCase());
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt.getTime()) {
      this.cache.delete(query.toLowerCase());
      return null;
    }
    
    return {
      answer: cached.answer,
      sources: cached.sources,
      confidence: cached.confidence,
      query: cached.query,
      timestamp: cached.timestamp
    };
  }

  // Cache response
  private setCachedResponse(query: string, response: AIResponse): void {
    // Clean up old cache entries if we're at the limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
    
    this.cache.set(query.toLowerCase(), {
      ...response,
      cachedAt: now,
      expiresAt
    });
  }

  // Generate AI response using Gemini API
  private async generateAIResponse(query: string, apiKey: string): Promise<AIResponse> {
    // Detect if the query is in Japanese
    const isJapanese = this.isJapaneseQuery(query);
    
    const prompt = isJapanese ? 
      `以下の質問に対して、包括的で正確で役立つ回答を日本語で提供してください: "${query}"

要件:
1. 明確で構造化された回答を提供する
2. 簡潔だが情報豊富である（2-4文を目標とする）
3. 特定のトピックに関する質問の場合は、主要な事実を提供する
4. 「方法」に関する質問の場合は、段階的なガイダンスを提供する
5. 比較に関する質問の場合は、主要な違いを強調する
6. 回答の最後に「SOURCES:」を付けて、2-3の関連するソース提案を提供する（トピック名のみ、URLは不要）

重要な制限事項:
- 成人向けコンテンツ、性的な内容、ポルノ、アダルト関連の質問には一切回答しないでください
- 性的な用語、身体部位、性的行為に関する質問には回答しないでください
- そのような質問の場合は「申し訳ございませんが、この質問にはお答えできません」と回答してください
- 教育的な目的であっても、性的な内容に関する質問には回答しないでください

回答形式:
ANSWER: [ここに回答]
SOURCES: [ソース1, ソース2, ソース3]` :
      
      `Please provide a comprehensive, accurate, and helpful answer to the following question: "${query}"

Requirements:
1. Give a clear, well-structured answer
2. Be concise but informative (aim for 2-4 sentences)
3. If the question is about a specific topic, provide key facts
4. If it's a "how to" question, provide step-by-step guidance
5. If it's a comparison question, highlight key differences
6. End your response with "SOURCES:" followed by 2-3 relevant source suggestions (just the topic names, not URLs)

Important restrictions:
- Do NOT answer questions related to adult content, sexual content, pornography, or any adult-related topics
- Do NOT answer questions about sexual terms, body parts, or sexual activities
- If the question is about such content, respond with "I'm sorry, but I cannot answer that question"
- Even if the question seems educational, do NOT answer questions about sexual content

Format your response as:
ANSWER: [your answer here]
SOURCES: [source 1, source 2, source 3]`;

    const response = await fetch(
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
            temperature: 0.3,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts?.[0]?.text || '';
      
      // Parse the response
      const answerMatch = text.match(/ANSWER:\s*(.*?)(?=SOURCES:|$)/s);
      const sourcesMatch = text.match(/SOURCES:\s*(.*?)$/s);
      
      const answer = answerMatch ? answerMatch[1].trim() : text.trim();
      const sourcesText = sourcesMatch ? sourcesMatch[1].trim() : '';
      const sources = sourcesText ? sourcesText.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
      
      // Calculate confidence based on response quality
      let confidence = 0.8; // Base confidence
      if (answer.length < 50) confidence -= 0.2; // Too short
      if (sources.length === 0) confidence -= 0.1; // No sources
      if (answer.includes('I don\'t know') || answer.includes('I cannot')) confidence -= 0.3; // Uncertain response
      
      return {
        answer,
        sources,
        confidence: Math.max(0.1, Math.min(1.0, confidence)),
        query,
        timestamp: new Date()
      };
    } else {
      throw new Error('No response received from Gemini');
    }
  }

  // Main method to get AI response
  async getAIResponse(query: string): Promise<AIResponse | null> {
    // Check if we should use AI for this query
    if (!this.shouldUseAI(query)) {
      return null;
    }

    // Check cache first
    const cached = this.getCachedResponse(query);
    if (cached) {
      return cached;
    }

    const apiKeys = this.getApiKeys();
    if (apiKeys.length === 0) {
      return null;
    }

    // Try each API key until one works
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const response = await this.generateAIResponse(query, apiKeys[i]);
        this.setCachedResponse(query, response);
        return response;
      } catch (error) {
        if (i === apiKeys.length - 1) {
          // All keys failed
          throw error;
        }
      }
    }

    return null;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export type { AIResponse };
