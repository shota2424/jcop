import { NextResponse } from 'next/server';
import { getMembers } from '@/lib/sheets';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json({ ok: true, count: members.length, members });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
