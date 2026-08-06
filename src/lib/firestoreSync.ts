import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const val = (data as Record<string, any>)[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

let isQuotaExceeded = false;

export async function syncDocToFirestore(collectionName: string, docId: string | number, data: any) {
  if (isQuotaExceeded) return;
  if (docId === undefined || docId === null) {
    console.warn(`[syncDocToFirestore] Skipping write: invalid docId for collection "${collectionName}"`);
    return;
  }
  const cleanId = String(docId).trim().replace(/\//g, '_');
  if (!cleanId) return;
  const path = `${collectionName}/${cleanId}`;
  try {
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, cleanId), sanitized, { merge: true });
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || (error?.message && error.message.includes('Quota limit exceeded'))) {
      if (!isQuotaExceeded) {
        console.warn('Firestore write quota exceeded. Application using local persistent state.');
        isQuotaExceeded = true;
      }
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocFromFirestore(collectionName: string, docId: string | number) {
  if (isQuotaExceeded) return;
  if (docId === undefined || docId === null) {
    console.warn(`[deleteDocFromFirestore] Skipping delete: invalid docId for collection "${collectionName}"`);
    return;
  }
  const cleanId = String(docId).trim().replace(/\//g, '_');
  if (!cleanId) return;
  const path = `${collectionName}/${cleanId}`;
  try {
    await deleteDoc(doc(db, collectionName, cleanId));
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || (error?.message && error.message.includes('Quota limit exceeded'))) {
      if (!isQuotaExceeded) {
        console.warn('Firestore delete quota exceeded. Application using local persistent state.');
        isQuotaExceeded = true;
      }
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
