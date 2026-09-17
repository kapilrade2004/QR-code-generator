import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (err: unknown) {
    console.error('Auth me error:', err);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
