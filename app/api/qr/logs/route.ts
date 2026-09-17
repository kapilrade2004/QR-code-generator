import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth';
import { createQrActivityLog, getQrLogsForUser } from '@/lib/services/qrLogs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await getQrLogsForUser(user.userId);
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    console.error('Error fetching QR logs:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to log QR activity' },
        { status: 401 }
      );
    }

    const { qrType, title, payload, metadata, action } = await req.json();

    if (!qrType || !payload) {
      return NextResponse.json(
        { error: 'Missing required QR data (qrType, payload)' },
        { status: 400 }
      );
    }

    const validAction = action === 'DOWNLOADED' || action === 'COPIED' ? action : 'GENERATED';

    const log = await createQrActivityLog({
      userId: user.userId,
      userEmail: user.email,
      qrType,
      title: title || `${qrType.toUpperCase()} QR Code`,
      payload,
      metadata: metadata || {},
      action: validAction
    });

    return NextResponse.json({ success: true, log });
  } catch (err: unknown) {
    console.error('Error recording QR log:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
