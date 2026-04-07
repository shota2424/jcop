// ============================================================
// JCOP v4.0 - Bills API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getBills, createBill, updateBillStatus } from '@/lib/sheets';
import { createBillFolders, getFolderUrl } from '@/lib/drive';
import type { Bill, BillStatus } from '@/lib/types';

export async function GET() {
  try {
    const bills = await getBills();
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('GET /api/bills error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bill: Bill = {
      billId: `BILL-${Date.now()}`,
      title: body.title,
      assigneeEmail: body.assigneeEmail || '',
      deadline: body.deadline || '',
      status: 'not_created' as BillStatus,
      relatedEventId: body.relatedEventId || '',
    };

    // Auto-create Google Drive folders
    let folderUrl = '';
    try {
      const folders = await createBillFolders(bill.title);
      folderUrl = getFolderUrl(folders.mainFolderId);
    } catch (err) {
      console.warn('Failed to create Drive folders:', err);
    }

    await createBill(bill);
    return NextResponse.json({ success: true, data: { ...bill, folderUrl } });
  } catch (error) {
    console.error('POST /api/bills error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create bill' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.billId || !body.status) {
      return NextResponse.json({ success: false, error: 'billId and status are required' }, { status: 400 });
    }
    await updateBillStatus(body.billId, body.status as BillStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/bills error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update bill' }, { status: 500 });
  }
}
