import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: string;
  qrCount: number;
  lastQrType?: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  passwordHash: { type: String, required: true },
  createdAt: { type: String, required: true },
  qrCount: { type: Number, default: 0 },
  lastQrType: { type: String },
});

export interface ILoginLog extends Document {
  id: string;
  userId?: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

const LoginLogSchema = new Schema<ILoginLog>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  userEmail: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  createdAt: { type: String, required: true },
});

export interface IQrActivityLog extends Document {
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

const QrActivityLogSchema = new Schema<IQrActivityLog>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  qrType: { type: String, required: true },
  title: { type: String },
  payload: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  action: { type: String, enum: ['GENERATED', 'DOWNLOADED', 'COPIED'], required: true },
  createdAt: { type: String, required: true },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const LoginLogModel = mongoose.models.LoginLog || mongoose.model<ILoginLog>('LoginLog', LoginLogSchema);
export const QrActivityLogModel = mongoose.models.QrActivityLog || mongoose.model<IQrActivityLog>('QrActivityLog', QrActivityLogSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kapilrade2004_db_user:2IAWT2FjYm45qhG8@cluster0.iswlp1o.mongodb.net/qr_code_db?retryWrites=true&w=majority';

// Global connection caching for serverless environments like Next.js on Vercel
let cached = (global as unknown as { mongooseConn?: Promise<typeof mongoose> }).mongooseConn;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  if (!cached) {
    cached = mongoose.connect(MONGODB_URI);
    (global as unknown as { mongooseConn?: Promise<typeof mongoose> }).mongooseConn = cached;
  }
  return cached;
}

export type User = {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: string;
  qrCount?: number;
  lastQrType?: string;
};

export type LoginLog = {
  id: string;
  userId?: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
};

export type QrActivityLog = {
  id: string;
  userId: string;
  userEmail: string;
  qrType: string;
  title?: string;
  payload: string;
  metadata?: Record<string, unknown>;
  action: 'GENERATED' | 'DOWNLOADED' | 'COPIED';
  createdAt: string;
};

export default mongoose;
