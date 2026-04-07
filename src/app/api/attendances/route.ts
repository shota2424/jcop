// ============================================================
// JCOP v4.0 - Attendances API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getAttendances, upsertAttendance } from '@/lib/sheets';
import type { Attendance, AttendanceStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get('eventId') || undefined;
    const attendances = await getAttendances(eventId);
    return NextResponse.json({ success: true, data: attendances });
  } catch (error) {
    console.error('GET /api/attendances error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch attendances' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const attendance: Attendance = {
      eventId: body.eventId,
      email: body.email,
      status: (body.status as AttendanceStatus) ?? 0,
      comment: body.comment || '',
      updatedAt: new Date().toISOString(),
    };
    await upsertAttendance(attendance);
    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error('POST /api/attendances error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save attendance' }, { status: 500 });
  }
}
