import { Role } from '../types';

/**
 * Returns a Google / Gmail profile picture URL for a given email address.
 * Uses Google profile unavatar API with clean UI-Avatars fallback.
 */
export const getGoogleAvatarUrl = (email?: string, name?: string, role?: Role | string): string => {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
  
  let colorBg = '0284c7'; // default blue
  if (role === 'principal') colorBg = 'd97706'; // amber
  else if (role === 'secretary') colorBg = '7c3aed'; // purple
  else if (role === 'principal_pa') colorBg = '2563eb'; // royal blue
  else if (role === 'secretary_pa') colorBg = '4f46e5'; // indigo
  else if (role === 'admin') colorBg = '0284c7'; // sky blue
  else if (role === 'staff') colorBg = '059669'; // emerald
  else if (role === 'librarian') colorBg = '0d9488'; // teal
  else if (role === 'incucula') colorBg = '9333ea'; // purple

  const uiAvatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${colorBg}&color=fff&bold=true&size=128`;

  if (cleanEmail && cleanEmail.includes('@')) {
    return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=${encodeURIComponent(uiAvatarFallback)}`;
  }

  return uiAvatarFallback;
};
