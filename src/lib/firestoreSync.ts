import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function syncDocToFirestore(collectionName: string, docId: string, data: any) {
  if (!docId || typeof docId !== 'string') {
    console.warn(`[syncDocToFirestore] Skipping write: invalid docId "${docId}" for collection "${collectionName}"`);
    return;
  }
  const cleanId = docId.trim();
  if (!cleanId) return;
  const path = `${collectionName}/${cleanId}`;
  try {
    await setDoc(doc(db, collectionName, cleanId), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocFromFirestore(collectionName: string, docId: string) {
  if (!docId || typeof docId !== 'string') {
    console.warn(`[deleteDocFromFirestore] Skipping delete: invalid docId "${docId}" for collection "${collectionName}"`);
    return;
  }
  const cleanId = docId.trim();
  if (!cleanId) return;
  const path = `${collectionName}/${cleanId}`;
  try {
    await deleteDoc(doc(db, collectionName, cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
