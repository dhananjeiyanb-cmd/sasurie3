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

async function main() {
  const url = `${BASE}/documents:runQuery?key=${encodeURIComponent(API_KEY)}`;
  const body = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'mentorMappings' }]
    }
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    console.log('runQuery status:', res.status);
    if (!res.ok) {
      console.log('Error:', await res.text());
      return;
    }
    const results = await res.json();
    console.log('Results response:', JSON.stringify(results, null, 2));
    if (Array.isArray(results)) {
      results.forEach((r: any, idx: number) => {
        const doc = r.document;
        if (doc) {
          const name = doc.name;
          const docId = name.split('/').pop();
          console.log(`[${idx}] Document ID: ${docId}`);
        }
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
