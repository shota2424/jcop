// ============================================================
// JCOP v4.0 - AI Parse Text API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { parseTextToEvent } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const events = await parseTextToEvent(body.text);
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('POST /api/ai/parse-text error:', error);
    return NextResponse.json({ success: false, error: 'AI text parsing failed' }, { status: 500 });
  }
}
