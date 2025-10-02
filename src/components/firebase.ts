// firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, serverTimestamp, set, get } from 'firebase/database';

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

// IndexedDB storage functions
const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DeviceStorageDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('deviceData')) {
        db.createObjectStore('deviceData');
      }
    };
  });
};

const saveToIndexedDB = async (key: string, value: string): Promise<void> => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['deviceData'], 'readwrite');
    const store = transaction.objectStore('deviceData');
    store.put(value, key);
  } catch (error) {
    console.warn('IndexedDB save failed:', error);
  }
};

const getFromIndexedDB = async (key: string): Promise<string | null> => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['deviceData'], 'readonly');
    const store = transaction.objectStore('deviceData');
    const request = store.get(key);
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('IndexedDB get failed:', error);
    return null;
  }
};

// Firebase device registration function - for analytics/logging only, not ID storage
const saveToFirebase = async (deviceId: string): Promise<void> => {
  try {
    const deviceRef = ref(database, `deviceRegistry/${deviceId}`);
    await set(deviceRef, {
      deviceId: deviceId,
      deviceName: deviceId,
      isNamed: false,
      searchBlocked: false, // Default value for search blocking
      firstVisit: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      hardwareConcurrency: navigator.hardwareConcurrency
    });
  } catch (error) {
    console.warn('Firebase device registration failed:', error);
  }
};

// REMOVED: getFromFirebase function - no longer needed for device identification
// Firebase is now only used for device registration and search logging, not ID retrieval

// Multi-storage save function - on-device storage only
const saveDeviceIdToAllStorages = async (deviceId: string): Promise<void> => {
  try {
    // Save to localStorage
    localStorage.setItem('deviceId', deviceId);
  } catch (error) {
    console.warn('localStorage save failed:', error);
  }
  
  try {
    // Save to sessionStorage
    sessionStorage.setItem('deviceId', deviceId);
  } catch (error) {
    console.warn('sessionStorage save failed:', error);
  }
  
  try {
    // Save to IndexedDB (most persistent on-device storage)
    await saveToIndexedDB('deviceId', deviceId);
  } catch (error) {
    console.warn('IndexedDB save failed:', error);
  }
  
  // Firebase is only used for device registration/logging, not ID storage
};

// Multi-storage get function - NO FIREBASE FALLBACK for device identification
const getDeviceIdFromAllStorages = async (): Promise<string | null> => {
  // Try localStorage first (fastest)
  try {
    const localId = localStorage.getItem('deviceId');
    if (localId) return localId;
  } catch (error) {
    console.warn('localStorage get failed:', error);
  }
  
  // Try sessionStorage
  try {
    const sessionId = sessionStorage.getItem('deviceId');
    if (sessionId) return sessionId;
  } catch (error) {
    console.warn('sessionStorage get failed:', error);
  }
  
  // Try IndexedDB (most persistent on-device storage)
  try {
    const indexedId = await getFromIndexedDB('deviceId');
    if (indexedId) return indexedId;
  } catch (error) {
    console.warn('IndexedDB get failed:', error);
  }
  
  // NO FIREBASE FALLBACK - each device must have its own unique ID
  return null;
};

export const generateDeviceId = (): string => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

export const getDeviceId = async (): Promise<string> => {
  // Try to get existing device ID from any storage
  let deviceId = await getDeviceIdFromAllStorages();
  
  if (!deviceId) {
    // Generate new device ID if none found
    deviceId = generateDeviceId();
    // Save to all storage methods
    await saveDeviceIdToAllStorages(deviceId);
  }
  
  return deviceId;
};

// Auto-register device on website load - Firebase registration for analytics only
export const initializeDeviceRegistration = async (): Promise<void> => {
  try {
    const deviceId = await getDeviceId();
    const deviceRef = ref(database, `deviceRegistry/${deviceId}`);
    
    // Check if device already exists in Firebase
    const snapshot = await get(deviceRef);
    
    if (snapshot.exists()) {
      // Device exists - only update lastSeen timestamp
      const existingData = snapshot.val();
      await set(deviceRef, {
        ...existingData, // Keep all existing data
        lastSeen: new Date().toISOString() // Only update lastSeen
      });
    } else {
      // New device - create initial registration in Firebase for analytics
      await saveToFirebase(deviceId);
    }
  } catch (error) {
    console.warn('Device registration failed:', error);
  }
};

// Function to check if device search is blocked
export const isDeviceSearchBlocked = async (): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    const deviceRef = ref(database, `deviceRegistry/${deviceId}`);
    const snapshot = await get(deviceRef);
    
    if (snapshot.exists()) {
      const deviceData = snapshot.val();
      return deviceData.searchBlocked;
    }
    
    // If device doesn't exist in Firebase, allow search (new device)
    return false;
  } catch (error) {
    console.warn('Failed to check device search status:', error);
    // If there's an error checking, allow search to prevent blocking users
    return false;
  }
};

// Search logging function
// Search logging function - Updated to include full results data
export const logSearch = async (query: string, searchType: 'web' | 'image', originalResults: any[]) => {
  try {
    const deviceId = await getDeviceId();
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