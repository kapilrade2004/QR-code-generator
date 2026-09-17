import mysql from 'mysql2/promise';

export interface User {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: string;
  qrCount?: number;
  lastQrType?: string;
}

export interface LoginLog {
  id: string;
  userId?: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface QrActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  qrType: string;
  title?: string;
  payload: string;
  metadata?: Record<string, unknown>;
  action: 'GENERATED' | 'DOWNLOADED' | 'COPIED';
  createdAt: string;
}

// Global connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'qr_code_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
