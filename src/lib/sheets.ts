// ============================================================
// JCOP v4.0 - Google Sheets API Wrapper
// ============================================================
import { google, sheets_v4 } from 'googleapis';
import type { Member, MemberPosition, JCEvent, Attendance, Bill, AttendanceStatus, BillStatus } from './types';

// ---------- Authentication ----------
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(),
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim().replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

const SPREADSHEET_ID = (process.env.GOOGLE_SPREADSHEET_ID ?? '').trim();

// ---------- Generic Helpers ----------
async function getSheetData(sheetName: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values as string[][]) || [];
}

async function appendRow(sheetName: string, values: string[]): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function updateRow(sheetName: string, rowIndex: number, values: string[]): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheets = getSheets();
  // Get the sheet ID first
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

// ---------- Members ----------
// Headers: 氏名, メールアドレス, 権限, 委員会, LINE表示名, 役職
export async function getMembers(): Promise<Member[]> {
  const data = await getSheetData('members');
  if (data.length <= 1) return []; // header only
  return data.slice(1).map((row) => ({
    name: row[0] || '',
    email: row[1] || '',
    role: (row[2] as 'admin' | 'member') || 'member',
    committee: row[3] || '',
    lineDisplayName: row[4] || '',
    position: (row[5] as MemberPosition) || '一般',
  }));
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const members = await getMembers();
  return members.find((m) => m.email === email) || null;
}

export async function updateMember(email: string, data: Partial<Member>): Promise<void> {
  const allData = await getSheetData('members');
  const rowIndex = allData.findIndex((row) => row[1] === email);
  if (rowIndex < 0) return;

  const current = allData[rowIndex];
  const updated = [
    data.name ?? current[0],
    data.email ?? current[1],
    data.role ?? current[2],
    data.committee ?? current[3],
    data.lineDisplayName ?? current[4],
    data.position ?? current[5] ?? '一般',
  ];
  await updateRow('members', rowIndex + 1, updated);
}

// ---------- Events ----------
// Headers: イベントID, 件名, 日時, 場所, カテゴリ, 詳細, 資料URL
export async function getEvents(): Promise<JCEvent[]> {
  const data = await getSheetData('events');
  if (data.length <= 1) return [];
  return data.slice(1).map((row) => ({
    eventId: row[0] || '',
    title: row[1] || '',
    dateTime: row[2] || '',
    location: row[3] || '',
    category: row[4] || '',
    detail: row[5] || '',
    documentUrl: row[6] || '',
  }));
}

export async function getEventById(eventId: string): Promise<JCEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.eventId === eventId) || null;
}

export async function createEvent(event: JCEvent): Promise<void> {
  await appendRow('events', [
    event.eventId,
    event.title,
    event.dateTime,
    event.location,
    event.category,
    event.detail,
    event.documentUrl,
  ]);
}

export async function updateEvent(eventId: string, data: Partial<JCEvent>): Promise<void> {
  const allData = await getSheetData('events');
  const rowIndex = allData.findIndex((row) => row[0] === eventId);
  if (rowIndex < 0) return;

  const current = allData[rowIndex];
  const updated = [
    data.eventId ?? current[0],
    data.title ?? current[1],
    data.dateTime ?? current[2],
    data.location ?? current[3],
    data.category ?? current[4],
    data.detail ?? current[5],
    data.documentUrl ?? current[6],
  ];
  await updateRow('events', rowIndex + 1, updated);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const allData = await getSheetData('events');
  const rowIndex = allData.findIndex((row) => row[0] === eventId);
  if (rowIndex < 0) return;
  await deleteRow('events', rowIndex + 1);
}

// ---------- Attendances ----------
// Headers: イベントID, メールアドレス, 回答(0-4), コメント, 更新日時
export async function getAttendances(eventId?: string): Promise<Attendance[]> {
  const data = await getSheetData('attendances');
  if (data.length <= 1) return [];
  let rows = data.slice(1);
  if (eventId) {
    rows = rows.filter((row) => row[0] === eventId);
  }
  return rows.map((row) => ({
    eventId: row[0] || '',
    email: row[1] || '',
    status: (parseInt(row[2]) || 0) as AttendanceStatus,
    comment: row[3] || '',
    updatedAt: row[4] || '',
  }));
}

export async function upsertAttendance(attendance: Attendance): Promise<void> {
  const allData = await getSheetData('attendances');
  const rowIndex = allData.findIndex(
    (row) => row[0] === attendance.eventId && row[1] === attendance.email
  );

  const values = [
    attendance.eventId,
    attendance.email,
    attendance.status.toString(),
    attendance.comment,
    attendance.updatedAt || new Date().toISOString(),
  ];

  if (rowIndex > 0) {
    await updateRow('attendances', rowIndex + 1, values);
  } else {
    await appendRow('attendances', values);
  }
}

export async function getUnrespondedMembers(eventId: string): Promise<Member[]> {
  const [members, attendances] = await Promise.all([
    getMembers(),
    getAttendances(eventId),
  ]);
  const respondedEmails = new Set(attendances.map((a) => a.email));
  return members.filter((m) => !respondedEmails.has(m.email));
}

// ---------- Bills ----------
// Headers: 議案ID, タイトル, 担当者メール, 期限, ステータス, 関連イベントID
export async function getBills(): Promise<Bill[]> {
  const data = await getSheetData('bills');
  if (data.length <= 1) return [];
  return data.slice(1).map((row) => ({
    billId: row[0] || '',
    title: row[1] || '',
    assigneeEmail: row[2] || '',
    deadline: row[3] || '',
    status: (row[4] as BillStatus) || 'not_created',
    relatedEventId: row[5] || '',
  }));
}

export async function createBill(bill: Bill): Promise<void> {
  await appendRow('bills', [
    bill.billId,
    bill.title,
    bill.assigneeEmail,
    bill.deadline,
    bill.status,
    bill.relatedEventId,
  ]);
}

export async function updateBillStatus(billId: string, status: BillStatus): Promise<void> {
  const allData = await getSheetData('bills');
  const rowIndex = allData.findIndex((row) => row[0] === billId);
  if (rowIndex < 0) return;

  const current = allData[rowIndex];
  current[4] = status;
  await updateRow('bills', rowIndex + 1, current);
}
