import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase-applet-config.json'), 'utf8'));

// Initialize Firebase using the exact same client SDK config
const app = initializeApp(CONFIG);
const db = CONFIG.firestoreDatabaseId ? getFirestore(app, CONFIG.firestoreDatabaseId) : getFirestore(app);

async function deleteCollection(collectionName: string) {
  console.log(`\nFetching documents from collection "${collectionName}" using client SDK...`);
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log(`No documents found in "${collectionName}".`);
      return;
    }
    
    console.log(`Found ${snapshot.docs.length} document(s) in "${collectionName}". Deleting...`);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, collectionName, d.id));
      console.log(`  - Deleted ${collectionName}/${d.id}`);
    }
  } catch (err) {
    console.error(`Error deleting collection "${collectionName}":`, err);
  }
}

async function main() {
  console.log('=== Firestore CLIENT SDK CLEANUP ===');
  console.log('Project ID :', CONFIG.projectId);
  console.log('Database ID:', CONFIG.firestoreDatabaseId || 'default');
  
  await deleteCollection('skillBankStudents');
  await deleteCollection('mentorMappings');
  
  console.log('\nCleanup finished.');
  process.exit(0);
}

main().catch(console.error);

