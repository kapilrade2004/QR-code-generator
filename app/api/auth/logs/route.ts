import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth';
import { getLoginLogsForUser } from '@/lib/services/loginLogs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await getLoginLogsForUser(user.userId);
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    console.error('Error fetching login logs:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
