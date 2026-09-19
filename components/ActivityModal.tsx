"use client";

import React, { useEffect, useState } from 'react';
import { 
  X, History, ShieldCheck, QrCode, Calendar, Clock, 
  ExternalLink, Copy, Check, Smartphone, Globe, RefreshCw, AlertCircle, Trash2
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
        // User requested: Remove auto "GENERATED" action from activity logs display, only keep saved/downloaded/copied or explicit items
        const filtered = (data.logs || []).filter((l: QrLogItem) => l.action !== 'GENERATED');
        setQrLogs(filtered);
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

  const formatDateTime = (isoStr: string): { datePart: string; timePart: string } => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return { datePart: isoStr, timePart: '' };
      
      const datePart = d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      return { datePart, timePart };
    } catch {
      return { datePart: isoStr, timePart: '' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">Activity & Audit Logs</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Krisha CRM
                </span>
              </div>
              <p className="text-xs text-slate-500">Live timeline with precise date, time, and device security audits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              title="Refresh logs"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          <button
            onClick={() => setTab('qr')}
            className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${
              tab === 'qr'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Saved & Exported QRs ({qrLogs.length})</span>
          </button>
          <button
            onClick={() => setTab('login')}
            className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Login Security Audit ({loginLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-slate-50/50">
          {tab === 'qr' && (
            qrLogs.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-slate-200/60 p-8 shadow-xs">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="text-slate-800 font-bold text-base mb-1">No Activity Logs Found</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  When you download, copy, or save QR codes, each event will be logged here with complete date and timestamps.
                </p>
              </div>
            ) : (
              qrLogs.map((log) => {
                const dt = formatDateTime(log.createdAt);
                return (
                  <div
                    key={log.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 uppercase border border-emerald-200/60">
                        {log.qrType.slice(0, 3)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{log.title || 'QR Code'}</span>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono break-all line-clamp-1 max-w-md">
                          {log.payload}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {dt.datePart}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {dt.timePart}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleCopyPayload(log.id, log.payload)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        title="Copy content"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
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
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          Load
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}

          {tab === 'login' && (
            loginLogs.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-slate-200/60 p-8 shadow-xs">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-slate-800 font-bold text-base mb-1">No Login Records</h4>
                <p className="text-slate-500 text-xs">Security authentication audits will appear here.</p>
              </div>
            ) : (
              loginLogs.map((log) => {
                const dt = formatDateTime(log.createdAt);
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <div
                    key={log.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{log.userEmail}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                          {log.userAgent || 'Web Browser'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold justify-end">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dt.datePart}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium justify-end mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{dt.timePart}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
