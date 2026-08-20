/**
 * Supabase Service & Database Sync Integration
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to perform direct
 * PostgreSQL REST API operations for single-doc upsert, bulk sync, and queries.
 */

const env = (import.meta as any).env as Record<string, string | undefined>;

export const getSupabaseConfig = () => {
  let url = (env.VITE_SUPABASE_URL || '').trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  const anonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();
  return {
    url,
    anonKey,
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
};

const getHeaders = (anonKey: string, preferUpsert = true) => {
  const headers: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
  if (preferUpsert) {
    headers['Prefer'] = 'resolution=merge-duplicates';
  }
  return headers;
};

/**
 * Upsert a single document/record into a Supabase table.
 */
export async function syncDocToSupabase(table: string, id: string, payload: any): Promise<boolean> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    console.warn('[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured.');
    return false;
  }

  const endpoint = `${url}/rest/v1/${table}`;
  const record = {
    id,
    data: payload,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: getHeaders(anonKey, true),
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Supabase Error] HTTP ${res.status} on ${table}/${id}:`, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Supabase Network Error] Failed to sync ${table}/${id}:`, err);
    return false;
  }
}

/**
 * Fetch all documents from a Supabase table.
 */
export async function fetchDocsFromSupabase<T = any>(table: string): Promise<{ id: string; data: T }[]> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return [];

  const endpoint = `${url}/rest/v1/${table}?select=*`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: getHeaders(anonKey, false),
    });

    if (!res.ok) {
      console.error(`[Supabase Error] Failed fetching ${table}: HTTP ${res.status}`);
      return [];
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => ({
      id: r.id,
      data: r.data || r,
    }));
  } catch (err) {
    console.error(`[Supabase Network Error] Failed fetching ${table}:`, err);
    return [];
  }
}

/**
 * Delete a document by ID from a Supabase table.
 */
export async function deleteDocFromSupabase(table: string, id: string): Promise<boolean> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return false;

  const endpoint = `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`;

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: getHeaders(anonKey, false),
    });

    return res.ok;
  } catch (err) {
    console.error(`[Supabase Error] Failed deleting ${table}/${id}:`, err);
    return false;
  }
}

/**
 * Bulk Sync: Pushes all student records and mentor mappings into Supabase.
 */
export async function migrateAllToSupabase(
  students: any[],
  mentorMappings: any[]
): Promise<{ success: boolean; syncedStudents: number; syncedMappings: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      syncedStudents: 0,
      syncedMappings: 0,
      error: 'Supabase URL or Anon Key is missing in Vercel / .env environment variables.',
    };
  }

  let studentSuccessCount = 0;
  let mappingSuccessCount = 0;

  for (const st of students) {
    const reg = st?.studentProfile?.registerNumber;
    if (reg) {
      const docId = String(reg).trim().replace(/\//g, '_');
      const ok = await syncDocToSupabase('skill_bank_students', docId, st);
      if (ok) studentSuccessCount += 1;
    }
  }

  for (const m of mentorMappings) {
    if (m?.mentorStaffId) {
      const ok = await syncDocToSupabase('mentor_mappings', m.mentorStaffId, m);
      if (ok) mappingSuccessCount += 1;
    }
  }

  return {
    success: true,
    syncedStudents: studentSuccessCount,
    syncedMappings: mappingSuccessCount,
  };
}
