import { QrActivityLogModel, UserModel, QrActivityLog, connectDB } from '../db';

export async function createQrActivityLog(data: {
  userId: string;
  userEmail: string;
  qrType: string;
  title?: string;
  payload: string;
  metadata?: Record<string, unknown>;
  action: 'GENERATED' | 'DOWNLOADED' | 'COPIED';
}): Promise<QrActivityLog> {
  await connectDB();
  const log: QrActivityLog = {
    id: 'qr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    userId: data.userId,
    userEmail: data.userEmail,
    qrType: data.qrType,
    title: data.title || `${data.qrType.toUpperCase()} QR Code`,
    payload: data.payload,
    metadata: data.metadata || {},
    action: data.action,
    createdAt: new Date().toISOString()
  };

  try {
    await QrActivityLogModel.create(log);

    // Update user's total QR count and last generated type
    await UserModel.updateOne(
      { id: log.userId },
      {
        $inc: { qrCount: 1 },
        $set: { lastQrType: log.qrType }
      }
    );
  } catch (err) {
    console.error('Failed to insert QR activity log into MongoDB:', err);
  }

  return log;
}

export async function getQrLogsForUser(userId: string): Promise<QrActivityLog[]> {
  try {
    await connectDB();
    const docs = await QrActivityLogModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      userId: d.userId,
      userEmail: d.userEmail,
      qrType: d.qrType,
      title: d.title,
      payload: d.payload,
      metadata: d.metadata,
      action: d.action,
      createdAt: d.createdAt
    }));
  } catch (err) {
    console.error('Failed to query QR activity logs from MongoDB:', err);
    return [];
  }
}
