'use server';

import {db} from '@/lib/firebase';
import {doc, getDoc, setDoc, increment, runTransaction} from 'firebase/firestore';

const COUNTER_DOC_ID = 'visitor-count';
const COUNTER_COLLECTION_ID = 'counters';

export async function incrementVisitorCount(): Promise<number> {
  const counterRef = doc(db, COUNTER_COLLECTION_ID, COUNTER_DOC_ID);

  try {
    // Atomically increment the count on the server.
    // If the document doesn't exist, it will be created with a count of 1.
    // This is more robust than the previous transaction logic for this use case.
    await setDoc(counterRef, { count: increment(1) }, { merge: true });
    
    // After incrementing, get the latest value to return.
    const updatedDoc = await getDoc(counterRef);

    if (updatedDoc.exists()) {
        return updatedDoc.data().count;
    } else {
        // This case should ideally not be reached if setDoc works, but it's good practice.
        return 1;
    }
  } catch (error) {
    console.error("Firebase transaction error:", error);
    // If the transaction fails, it might be due to permissions or setup issues.
    // We'll return 0 and log the error. The UI will show nothing instead of crashing.
    return 0;
  }
}
