import { LoginLogModel, LoginLog, connectDB } from '../db';

export async function createLoginLog(data: {
  userId?: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
}): Promise<LoginLog> {
  await connectDB();
  const log: LoginLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    userId: data.userId || undefined,
    userEmail: data.userEmail,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    status: data.status,
    createdAt: new Date().toISOString()
  };

  try {
    await LoginLogModel.create(log);
  } catch (err) {
    console.error('Failed to insert login log into MongoDB:', err);
  }

  return log;
}

export async function getLoginLogsForUser(userId: string): Promise<LoginLog[]> {
  try {
    await connectDB();
    const docs = await LoginLogModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      userId: d.userId,
      userEmail: d.userEmail,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      status: d.status,
      createdAt: d.createdAt
    }));
  } catch (err) {
    console.error('Failed to query login logs from MongoDB:', err);
    return [];
  }
}
