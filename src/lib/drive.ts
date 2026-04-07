// ============================================================
// JCOP v4.0 - Google Drive API Wrapper
// ============================================================
import { google } from 'googleapis';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(),
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim().replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

const ROOT_FOLDER_ID = (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '').trim();

// ---------- Create folder ----------
export async function createFolder(name: string, parentId?: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId || ROOT_FOLDER_ID],
    },
    fields: 'id',
  });
  return res.data.id || '';
}

// ---------- Create bill folders ----------
// 所定のフォルダ構造を自動作成: 20_正副 / 30_理事会
export async function createBillFolders(billTitle: string): Promise<{
  mainFolderId: string;
  subfolder20Id: string;
  subfolder30Id: string;
}> {
  const mainFolderId = await createFolder(billTitle);
  const [subfolder20Id, subfolder30Id] = await Promise.all([
    createFolder('20_正副', mainFolderId),
    createFolder('30_理事会', mainFolderId),
  ]);
  return { mainFolderId, subfolder20Id, subfolder30Id };
}

// ---------- List files in folder ----------
export async function listFilesInFolder(folderId: string): Promise<{ id: string; name: string; mimeType: string }[]> {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  return (res.data.files || []).map((f) => ({
    id: f.id || '',
    name: f.name || '',
    mimeType: f.mimeType || '',
  }));
}

// ---------- Get folder URL ----------
export function getFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
