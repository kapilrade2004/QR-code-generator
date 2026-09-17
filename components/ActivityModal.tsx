"use client";

import React, { useEffect, useState } from 'react';
import { 
  X, History, ShieldCheck, QrCode, Calendar, Clock, 
  ExternalLink, Copy, Check, Smartphone, Globe, RefreshCw, AlertCircle
} from 'lucide-react';

export interface LoginLogItem {
  id: string;
  userId?: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface QrLogItem {
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

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQr?: (log: QrLogItem) => void;
}

export default function ActivityModal({ isOpen, onClose, onSelectQr }: ActivityModalProps) {
  const [tab, setTab] = useState<'qr' | 'login'>('qr');
  const [qrLogs, setQrLogs] = useState<QrLogItem[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qrRes, loginRes] = await Promise.all([
        fetch('/api/qr/logs'),
        fetch('/api/auth/logs')
      ]);

      if (qrRes.ok) {
        const data = await qrRes.json();
        setQrLogs(data.logs || []);
      }
      if (loginRes.ok) {
        const data = await loginRes.json();
        setLoginLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load activity data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPayload = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">Activity & Audit Logs</h3>
              <p className="text-xs text-slate-500">Track all QR generations and account login events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              title="Refresh logs"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setTab('qr')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
              tab === 'qr'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Generations ({qrLogs.length})</span>
          </button>
          <button
            onClick={() => setTab('login')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Login History ({loginLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {tab === 'qr' ? (
            <div className="space-y-3">
              {qrLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <QrCode className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No QR codes generated yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Generate or download a QR code to see it here.</p>
                </div>
              ) : (
                qrLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {log.qrType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                          Action: {log.action}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs font-mono text-slate-600 break-all bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {log.payload}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyPayload(log.id, log.payload)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
                        title="Copy content"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onSelectQr && (
                        <button
                          onClick={() => {
                            onSelectQr(log);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Load in Editor</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {loginLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No login logs found.</p>
                </div>
              ) : (
                loginLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <div
                      key={log.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{log.userEmail}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            IP: {log.ipAddress || '127.0.0.1'}
                          </span>
                          <span className="flex items-center gap-1 truncate max-w-sm" title={log.userAgent}>
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            {log.userAgent || 'Browser session'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
