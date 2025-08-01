'use server';

import {db} from '@/lib/firebase';
import {doc, getDoc, setDoc, runTransaction} from 'firebase/firestore';

const COUNTER_DOC_ID = 'visitor-count';
const COUNTER_COLLECTION_ID = 'counters';

export async function incrementVisitorCount(): Promise<number> {
  const counterRef = doc(db, COUNTER_COLLECTION_ID, COUNTER_DOC_ID);

  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { count: 1 });
        return 1;
      }
      
      const newCount = counterDoc.data().count + 1;
      transaction.update(counterRef, { count: newCount });
      return newCount;
    });
    return newCount;
  } catch (error) {
    console.error("Firebase transaction error:", error);
    // If the transaction fails, it's likely a configuration or permission issue.
    // Return 0 and let the UI handle it gracefully.
    return 0;
  }
}
