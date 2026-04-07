import { NextResponse } from 'next/server';
import { getMembers } from '@/lib/sheets';

export async function GET() {
  const env = {
    GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID || '(empty)',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '(empty)',
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
      ? `set (${process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length} chars, starts: ${process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.substring(0, 30)})`
      : '(empty)',
  };

  try {
    const members = await getMembers();
    return NextResponse.json({ ok: true, count: members.length, members, env });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), env }, { status: 500 });
  }
}
