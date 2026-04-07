// ============================================================
// JCOP v4.0 - Events API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/lib/sheets';
import type { JCEvent } from '@/lib/types';

export async function GET() {
  try {
    const events = await getEvents();
    // Sort by date, newest first
    events.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event: JCEvent = {
      eventId: `EVT-${Date.now()}`,
      title: body.title,
      dateTime: body.dateTime,
      location: body.location || '',
      category: body.category || 'その他',
      detail: body.detail || '',
      documentUrl: body.documentUrl || '',
    };
    await createEvent(event);
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 });
  }
}
