// ============================================================
// JCOP v4.0 - Mention API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getUnrespondedMembers } from '@/lib/sheets';
import { buildMentionText } from '@/lib/line';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    const unresponded = await getUnrespondedMembers(body.eventId);
    const names = unresponded.map((m) => m.lineDisplayName || m.name);
    const mentionText = buildMentionText(names, body.eventTitle || '');

    return NextResponse.json({
      success: true,
      data: {
        unrespondedCount: unresponded.length,
        members: unresponded,
        mentionText,
      },
    });
  } catch (error) {
    console.error('POST /api/mention error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate mentions' }, { status: 500 });
  }
}
