import pool, { LoginLog } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function createLoginLog(data: {
  userId?: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
}): Promise<LoginLog> {
  const log: LoginLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    userId: data.userId || undefined,
    userEmail: data.userEmail,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    status: data.status,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };

  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO login_logs (id, userId, userEmail, ipAddress, userAgent, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.userId || null, log.userEmail, log.ipAddress || null, log.userAgent || null, log.status, log.createdAt]
    );
  } catch (err) {
    console.error('Failed to insert login log into MySQL:', err);
  }

  return log;
}

export async function getLoginLogsForUser(userId: string): Promise<LoginLog[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, userId, userEmail, ipAddress, userAgent, status, createdAt
       FROM login_logs
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [userId]
    );
    return rows as LoginLog[];
  } catch (err) {
    console.error('Failed to query login logs from MySQL:', err);
    return [];
  }
}
