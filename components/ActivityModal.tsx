"use client";

import React, { useEffect, useState } from 'react';
import { 
  X, ShieldCheck, Calendar, Clock, RefreshCw, AlertCircle, Laptop, Smartphone, Globe
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

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLoginData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logs');
      if (res.ok) {
        const data = await res.json();
        setLoginLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load login audit data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLoginData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const getDeviceIcon = (ua?: string) => {
    if (!ua) return <Globe className="w-4 h-4 text-slate-400" />;
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-emerald-600" />;
    }
    return <Laptop className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">Login Security Audit</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-time authentication records, IP tracing, and device timestamps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLoginData}
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

        {/* Content Body: Dedicated Login Security Audit */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-slate-50/50">
          {loading && loginLogs.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading security audit records...</p>
            </div>
          ) : loginLogs.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-slate-200/60 p-8 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-slate-800 font-bold text-base mb-1">No Login Records Found</h4>
              <p className="text-slate-500 text-xs">Security authentication and access attempts will appear here.</p>
            </div>
          ) : (
            loginLogs.map((log) => {
              const dt = formatDateTime(log.createdAt);
              const isSuccess = log.status === 'SUCCESS';
              return (
                <div
                  key={log.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
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
                      
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          {getDeviceIcon(log.userAgent)}
                          <span className="truncate max-w-[200px] sm:max-w-xs">{log.userAgent || 'Web Client'}</span>
                        </span>
                        {log.ipAddress && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">IP: {log.ipAddress}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dt.datePart}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium sm:justify-end mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{dt.timePart}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Logged {loginLogs.length} authentication events</span>
          <span className="font-semibold text-slate-700">QR Studio Security</span>
        </div>

      </div>
    </div>
  );
}
