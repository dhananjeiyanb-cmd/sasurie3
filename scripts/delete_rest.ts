import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase-applet-config.json'), 'utf8'));
const PROJECT_ID = CONFIG.projectId;
const DB_ID = CONFIG.firestoreDatabaseId || 'default';
const API_KEY = CONFIG.apiKey;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}`;

async function deleteDocRest(collection: string, docId: string) {
  const url = `${BASE}/documents/${collection}/${encodeURIComponent(docId)}?key=${encodeURIComponent(API_KEY)}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    console.log(`DELETE ${collection}/${docId}: status ${res.status}`);
    if (!res.ok) {
      const text = await res.text();
      console.log('Error:', text);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

async function main() {
  // Let's try to delete the doc
  await deleteDocRest('skillBankStudents', '732461398841');
}

main();

