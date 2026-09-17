import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { User } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { signToken, COOKIE_NAME, getClientInfo } from '@/lib/services/auth';
import { createLoginLog } from '@/lib/services/loginLogs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const { ip, userAgent } = getClientInfo(req);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, name, passwordHash FROM users WHERE email = ?',
      [cleanEmail]
    );

    const user = rows[0] as User | undefined;

    if (!user) {
      await createLoginLog({
        userEmail: cleanEmail,
        ipAddress: ip,
        userAgent,
        status: 'FAILED'
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await createLoginLog({
        userId: user.id,
        userEmail: user.email,
        ipAddress: ip,
        userAgent,
        status: 'FAILED'
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Success log
    await createLoginLog({
      userId: user.id,
      userEmail: user.email,
      ipAddress: ip,
      userAgent,
      status: 'SUCCESS'
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (err: unknown) {
    console.error('Login error in MySQL:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
