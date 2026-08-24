import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeDept, buildMentorMappingsFromStudents } from '../src/utils/departmentUtils';
import { StudentSkillBankData } from '../src/types/skillBank';
import { Staff } from '../src/types';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase-applet-config.json'), 'utf8'));

// Initialize Firebase Client SDK
const app = initializeApp(CONFIG);
const db = CONFIG.firestoreDatabaseId ? getFirestore(app, CONFIG.firestoreDatabaseId) : getFirestore(app);

async function main() {
  console.log('=== Firestore Clean Up for CSE and Civil Departments ===');
  console.log('Project ID :', CONFIG.projectId);
  console.log('Database ID:', CONFIG.firestoreDatabaseId || 'default');

  try {
    // 1. Fetch all staff members
    console.log('\nFetching staff records...');
    const staffSnap = await getDocs(collection(db, 'staff'));
    const staffList: Staff[] = [];
    staffSnap.forEach((d) => {
      staffList.push({ id: d.id, ...d.data() } as Staff);
    });
    console.log(`Fetched ${staffList.length} staff records.`);

    // 2. Fetch all skillBankStudents documents
    console.log('\nFetching student records from "skillBankStudents"...');
    const studentsSnap = await getDocs(collection(db, 'skillBankStudents'));
    const allStudents: { docId: string; data: StudentSkillBankData }[] = [];
    studentsSnap.forEach((d) => {
      allStudents.push({ docId: d.id, data: d.data() as StudentSkillBankData });
    });
    console.log(`Fetched ${allStudents.length} student records.`);

    // 3. Filter target and non-target students
    const targetStudents: typeof allStudents = [];
    const remainingStudents: StudentSkillBankData[] = [];

    allStudents.forEach((st) => {
      const dept = st.data.studentProfile?.department || '';
      const normalized = normalizeDept(dept);
      if (normalized === 'cse' || normalized === 'civil') {
        targetStudents.push(st);
      } else {
        remainingStudents.push(st.data);
      }
    });

    console.log(`\nFound ${targetStudents.length} students belonging to Computer Science & Engineering (cse) or Civil Engineering (civil):`);
    targetStudents.forEach((st) => {
      console.log(`  - [${st.data.studentProfile?.department}] Reg: ${st.data.studentProfile?.registerNumber} Name: ${st.data.studentProfile?.studentName}`);
    });

    // 4. Delete target students from "skillBankStudents"
    if (targetStudents.length > 0) {
      console.log('\nDeleting target students from Firestore...');
      for (const st of targetStudents) {
        await deleteDoc(doc(db, 'skillBankStudents', st.docId));
        console.log(`  Deleted skillBankStudents/${st.docId}`);
      }
      console.log('Deletion completed.');
    } else {
      console.log('\nNo matching students found to delete.');
    }

    // 5. Clear and rebuild the "mentorMappings" collection
    console.log('\nRebuilding "mentorMappings" collection from remaining students...');
    const mappingsSnap = await getDocs(collection(db, 'mentorMappings'));
    console.log(`  - Found ${mappingsSnap.docs.length} existing mappings. Clearing them first...`);
    for (const d of mappingsSnap.docs) {
      await deleteDoc(doc(db, 'mentorMappings', d.id));
      console.log(`    Deleted mentorMappings/${d.id}`);
    }

    const newMappings = buildMentorMappingsFromStudents(remainingStudents, staffList);
    const now = new Date().toISOString();
    console.log(`  - Recomputed ${newMappings.length} mappings from the remaining ${remainingStudents.length} students. Writing to database...`);
    for (const m of newMappings) {
      if (m.mentorStaffId) {
        const mappingWithTime = { ...m, updatedAt: now };
        await setDoc(doc(db, 'mentorMappings', m.mentorStaffId), mappingWithTime);
        console.log(`    Written mentorMappings/${m.mentorStaffId} with ${m.menteeRegNumbers.length} mentees`);
      }
    }

    console.log('\nSuccessfully rebuilt mentor mappings.');
  } catch (err) {
    console.error('Error running clean up script:', err);
  }

  process.exit(0);
}

main();

