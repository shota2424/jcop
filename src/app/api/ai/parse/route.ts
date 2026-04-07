// ============================================================
// JCOP v4.0 - AI Parse File API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { parseFileToEvents } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const events = await parseFileToEvents(buffer, file.type, file.name);

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('POST /api/ai/parse error:', error);
    return NextResponse.json({ success: false, error: 'AI parsing failed' }, { status: 500 });
  }
}
