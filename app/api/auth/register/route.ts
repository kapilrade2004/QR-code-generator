import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserModel, User, connectDB } from '@/lib/db';
import { signToken, COOKIE_NAME, getClientInfo } from '@/lib/services/auth';
import { createLoginLog } from '@/lib/services/loginLogs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing
    const existingUser = await UserModel.findOne({ email: cleanEmail }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      passwordHash,
      createdAt: new Date().toISOString(),
      qrCount: 0
    };

    await UserModel.create(newUser);

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name
    });

    const { ip, userAgent } = getClientInfo(req);
    await createLoginLog({
      userId: newUser.id,
      userEmail: newUser.email,
      ipAddress: ip,
      userAgent,
      status: 'SUCCESS'
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
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
    console.error('Registration error in MongoDB:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
