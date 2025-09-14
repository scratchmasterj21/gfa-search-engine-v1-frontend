// Test examples for Japanese AI query detection
// This file is for demonstration purposes only

export const japaneseTestQueries = [
  // Questions that should trigger AI
  "人工知能とは何ですか？",
  "AIとは何でしょうか",
  "機械学習について教えてください",
  "プログラミングの方法を教えて",
  "ReactとVueの違いは何ですか？",
  "なぜ空は青いのですか？",
  "どうやってパスタを作りますか？",
  "日本の歴史について説明してください",
  "英語の勉強方法を教えてください",
  "iPhoneとAndroidの比較",
  
  // Questions that should NOT trigger AI
  "site:github.com",
  "filetype:pdf",
  "google.com",
  "cat images",
  "東京 天気",
  "ニュース",
  "画像検索"
];

export const englishTestQueries = [
  // Questions that should trigger AI
  "What is artificial intelligence?",
  "How to cook pasta?",
  "Compare iPhone vs Android",
  "Why is the sky blue?",
  "Explain machine learning",
  "What are the benefits of exercise?",
  "How does photosynthesis work?",
  "Tell me about Japanese culture",
  
  // Questions that should NOT trigger AI
  "site:github.com",
  "filetype:pdf",
  "google.com",
  "cat images",
  "weather",
  "news"
];

// Usage example:
// import { aiService } from '../services/aiService';
// 
// japaneseTestQueries.forEach(query => {
// });
