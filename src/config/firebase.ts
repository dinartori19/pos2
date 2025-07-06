import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/config/env';

// Declare variables at module level
let app: any;
let auth: any;
let db: any;
let storage: any;

// Initialize Firebase
try {
  console.log('Initializing Firebase with config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey
  });
  
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Enable offline persistence for Firestore
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log('Firestore persistence enabled successfully');
      })
      .catch((err) => {
        console.warn('Error enabling Firestore persistence:', err);
      });
  }

  // Use emulators in development if needed
  if (import.meta.env.DEV && window.location.hostname === 'localhost') {
    // Uncomment the following lines if you're using Firebase emulators
    // connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
  console.log('Firebase initialized successfully');
  
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