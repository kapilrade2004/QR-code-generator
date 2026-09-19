"use client";

import React, { useEffect, useState } from 'react';
import { 
  X, ShieldCheck, Calendar, Clock, RefreshCw, Laptop, Smartphone, Globe, CheckCircle2, XCircle
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
      let parseStr = isoStr;
      if (isoStr && !isoStr.endsWith('Z') && isoStr.includes(' ')) {
        parseStr = isoStr.replace(' ', 'T') + 'Z';
      }
      const d = new Date(parseStr);
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

  // Helper to parse device & browser neatly
  const parseBrowserDevice = (ua?: string) => {
    if (!ua) return { browser: 'Web Client', device: 'Desktop', isMobile: false };
    
    let browser = 'Web Browser';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

    let device = 'Desktop PC';
    let isMobile = false;
    if (ua.includes('Windows NT 10.0')) device = 'Windows 10/11';
    else if (ua.includes('Macintosh')) device = 'macOS';
    else if (ua.includes('Android')) { device = 'Android Device'; isMobile = true; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { device = 'iOS Device'; isMobile = true; }
    else if (ua.includes('Linux')) device = 'Linux PC';

    return { browser, device, isMobile };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">Login Security Audit</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time authentication records, IP tracing, and device timestamps</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchLoginData}
              title="Refresh logs"
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar bg-slate-50/60">
          {loading && loginLogs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-semibold">Fetching security audit records...</p>
            </div>
          ) : loginLogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-slate-800 font-bold text-base mb-1">No Login Records Found</h4>
              <p className="text-slate-500 text-xs">Security authentication and access attempts will appear here.</p>
            </div>
          ) : (
            loginLogs.map((log) => {
              const dt = formatDateTime(log.createdAt);
              const isSuccess = log.status === 'SUCCESS';
              const parsed = parseBrowserDevice(log.userAgent);

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: User & Device Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isSuccess 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                          : 'bg-rose-50 border-rose-200 text-rose-600'
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {log.userEmail}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>

                      {/* Clean Device & Browser Pills */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-medium bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          {parsed.isMobile ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> : <Laptop className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{parsed.browser} • {parsed.device}</span>
                        </span>

                        {log.ipAddress && (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] uppercase text-slate-400 font-sans font-bold">IP</span>
                            <span>{log.ipAddress}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date & Time in Clean Distinct Badges */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-slate-100/70 px-3 py-1 rounded-lg border border-slate-200/50">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dt.datePart}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/60">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{dt.timePart}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Total {loginLogs.length} authentication events recorded</span>
          <span className="font-extrabold text-slate-700 tracking-tight">QR Studio Security</span>
        </div>

      </div>
    </div>
  );
}
