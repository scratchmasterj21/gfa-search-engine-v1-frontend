// firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Device ID utilities
export const generateDeviceId = (): string => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Search logging function
// Search logging function - Updated to include full results data
export const logSearch = async (query: string, searchType: 'web' | 'image', originalResults: any[]) => {
  try {
    const deviceId = getDeviceId();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const searchLogRef = ref(database, `searchLogs/${year}/${month}/${day}`);
    
    // Format date as MM/DD/YYYY HH:MM:SS
    const formattedDate = `${month}/${day}/${year} ${now.toTimeString().split(' ')[0]}`;

    if (searchType === "image") {
  searchType += "s"; // Now it's "images"
}
    // Format results to match the structure you showed
    const resultsToLog = originalResults.map((item) => ({
      contentUrl: item.link || item.contentUrl,
      displayUrl: item.displayUrl || new URL(item.link).hostname,
      faviconUrl: item.faviconUrl || `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}`,
      name: item.title || item.name,
      snippet: item.snippet,
      thumbnailUrl: item.pagemap?.cse_thumbnail?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.thumbnailUrl || "",
      url: item.link || item.url
    }));
    
    const logData = {
      date: formattedDate, // MM/DD/YYYY HH:MM:SS format
      deviceId: deviceId,
      query: query,
      searchType: searchType,
      results: resultsToLog, // Results in the format matching your Firebase structure
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    };
    
    await push(searchLogRef, logData);
  } catch (error) {
  }
};