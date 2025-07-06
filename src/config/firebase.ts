import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/config/env';

// Declare variables at module level
let app: any;
let auth: any;
let db: any;
let storage: any;

// Track initialization status
let isInitialized = false;

// Track initialization status
let isInitialized = false;

// Initialize Firebase
try {
  console.log('Initializing Firebase with config:', {
    projectId: firebaseConfig.projectId
  // Only initialize once
  if (!isInitialized) {
    console.log('Initializing Firebase...');
    
    // Initialize the Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize auth
    auth = getAuth(app);
    
    // Initialize Firestore with settings for better offline support
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true, // More reliable for spotty connections
    });
    
    // Initialize storage
    storage = getStorage(app);
    
    // Enable offline persistence for Firestore
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore persistence enabled successfully');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
  // Only initialize once
  if (!isInitialized) {
    console.log('Initializing Firebase...');
    
    // Initialize the Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize auth
    auth = getAuth(app);
    
    // Initialize Firestore with settings for better offline support
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true, // More reliable for spotty connections
    });
    
    // Initialize storage
    storage = getStorage(app);
    
    // Enable offline persistence for Firestore
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore persistence enabled successfully');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence could not be enabled: multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not supported by browser');
          } else {
            console.warn('Error enabling Firestore persistence:', err);
          }
        });
    }
    
    // Mark as initialized
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // Provide fallback implementations to prevent app crashes
  app = {} as any;
  auth = {} as any;
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false, data: () => ({}) }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve()
      }),
      where: () => ({
        get: () => Promise.resolve({ empty: true, docs: [] })
      }),
      orderBy: () => ({
        get: () => Promise.resolve({ empty: true, docs: [] })
      }),
      add: () => Promise.resolve({ id: 'dummy-id' })
    })
  } as any;
  storage = {} as any;
}

export { auth, db, storage };
export default app;