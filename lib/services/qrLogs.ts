import pool, { QrActivityLog } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function createQrActivityLog(data: {
  userId: string;
  userEmail: string;
  qrType: string;
  title?: string;
  payload: string;
  metadata?: Record<string, unknown>;
  action: 'GENERATED' | 'DOWNLOADED' | 'COPIED';
}): Promise<QrActivityLog> {
  const log: QrActivityLog = {
    id: 'qr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    userId: data.userId,
    userEmail: data.userEmail,
    qrType: data.qrType,
    title: data.title || `${data.qrType.toUpperCase()} QR Code`,
    payload: data.payload,
    metadata: data.metadata || {},
    action: data.action,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };

  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO qr_activity_logs (id, userId, userEmail, qrType, title, payload, metadata, action, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.userId,
        log.userEmail,
        log.qrType,
        log.title || null,
        log.payload,
        JSON.stringify(log.metadata || {}),
        log.action,
        log.createdAt
      ]
    );

    // Update user's total QR count and last generated type
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET qrCount = qrCount + 1, lastQrType = ? WHERE id = ?`,
      [log.qrType, log.userId]
    );
  } catch (err) {
    console.error('Failed to insert QR activity log into MySQL:', err);
  }

  return log;
}

export async function getQrLogsForUser(userId: string): Promise<QrActivityLog[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, userId, userEmail, qrType, title, payload, metadata, action, createdAt
       FROM qr_activity_logs
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [userId]
    );
    return rows as QrActivityLog[];
  } catch (err) {
    console.error('Failed to query QR activity logs from MySQL:', err);
    return [];
  }
}
