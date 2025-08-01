'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, runTransaction, DocumentData } from 'firebase/firestore';

// This configuration should be filled out in your src/lib/firebase.ts file
// but we will also define it here as a fallback for the server-side environment.
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

const COUNTER_COLLECTION_ID = 'counters';
const COUNTER_DOC_ID = 'visitor-count';

export async function incrementVisitorCount(): Promise<number> {
  const counterRef = doc(db, COUNTER_COLLECTION_ID, COUNTER_DOC_ID);

  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        // If the document does not exist, create it with a count of 1
        transaction.set(counterRef, { count: 1 });
        return 1;
      }
      
      // If the document exists, increment the count
      const currentCount = (counterDoc.data() as DocumentData).count || 0;
      const newCount = currentCount + 1;
      transaction.update(counterRef, { count: newCount });
      return newCount;
    });
    return newCount;
  } catch (error) {
    console.error("Firebase transaction failed:", error);
    // Return 0 to indicate failure, which the client can handle.
    return 0;
  }
}
