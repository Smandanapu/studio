'use server';

import {db} from '@/lib/firebase';
import {doc, getDoc, setDoc, increment} from 'firebase/firestore';

const COUNTER_DOC_ID = 'visitor-count';
const COUNTER_COLLECTION_ID = 'counters';

export async function incrementVisitorCount(): Promise<number> {
  const counterRef = doc(db, COUNTER_COLLECTION_ID, COUNTER_DOC_ID);

  try {
    // We use a transaction to safely increment the counter
    await setDoc(counterRef, {count: increment(1)}, {merge: true});
    const updatedDoc = await getDoc(counterRef);
    if (updatedDoc.exists()) {
      return updatedDoc.data().count;
    }
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    // If it fails, maybe the document doesn't exist yet.
    try {
      await setDoc(counterRef, {count: 1});
      return 1;
    } catch (e) {
      console.error('Error creating visitor count:', e);
    }
  }
  // Fallback
  const currentDoc = await getDoc(counterRef);
  if (currentDoc.exists()) {
    return currentDoc.data().count;
  }

  return 0;
}
