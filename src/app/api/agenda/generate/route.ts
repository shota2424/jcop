// ============================================================
// JCOP v4.0 - Agenda Generation API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { generateAgendaContent } from '@/lib/gemini';
import { getAttendances, getBills } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, title, date, totalMembers, templateText } = body;

    // Get attendance count
    const attendances = await getAttendances(eventId);
    const attendeeCount = attendances.filter((a) => a.status === 1).length;

    // Get related bills
    const allBills = await getBills();
    const relatedBills = allBills
      .filter((b) => b.relatedEventId === eventId)
      .map((b) => ({
        title: b.title,
        status: b.status === 'not_created' ? '未作成' : b.status === 'in_progress' ? '作成中' : '提出済',
      }));

    const agendaContent = await generateAgendaContent(templateText || '', {
      title,
      date,
      attendeeCount,
      totalMembers: totalMembers || 0,
      bills: relatedBills,
    });

    return NextResponse.json({ success: true, data: { content: agendaContent } });
  } catch (error) {
    console.error('POST /api/agenda/generate error:', error);
    return NextResponse.json({ success: false, error: 'Agenda generation failed' }, { status: 500 });
  }
}
