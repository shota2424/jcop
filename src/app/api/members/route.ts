// ============================================================
// JCOP v4.0 - Members API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getMembers, updateMember } from '@/lib/sheets';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('GET /api/members error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    await updateMember(body.email, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/members error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update member' }, { status: 500 });
  }
}
