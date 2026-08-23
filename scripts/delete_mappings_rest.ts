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
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

async function main() {
  console.log('Clearing all possible mentorMappings via REST...');
  
  // List of all staff IDs in Sasurie
  const staffIds = [
    'FAC001', 'FAC002', 'FAC003', 'FAC004', 'FAC005', 'FAC006', 'FAC007', 'FAC008', 'FAC009', 'FAC010',
    'STF001', 'STF002', 'STF003', 'STF004', 'STF005', 'STF006', 'STF007', 'STF008', 'STF009', 'STF010',
    'ADM001', 'HOD001', 'PRI001', 'SEC001', 'PRIPA001', 'SECPA001', 'LIB001', 'INC001'
  ];

  for (const id of staffIds) {
    await deleteDocRest('mentorMappings', id);
  }
  
  console.log('Finished clearing mentorMappings.');
}

main();

