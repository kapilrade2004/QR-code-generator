"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  ArrowLeft, QrCode, Search, Filter, RefreshCw, Calendar, Clock,
  ExternalLink, Copy, Check, Download, AlertCircle, Sparkles, User, FileText, AppWindow, MessageSquare, Mail, Phone, Share2, MapPin, File, ShieldCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';

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

export default function MyQrCodesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [logs, setLogs] = useState<QrLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser({
            id: data.user.userId,
            email: data.user.email,
            name: data.user.name
          });
          setAuthModalOpen(false);
        } else {
          setUser(null);
          setAuthModalOpen(true);
        }
      })
      .catch(() => {
        setUser(null);
        setAuthModalOpen(true);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/qr/logs');
      if (res.ok) {
        const data = await res.json();
        // Exclude raw un-saved GENERATED events, keep clean saved/downloaded/copied list
        const filtered = (data.logs || []).filter((l: QrLogItem) => l.action !== 'GENERATED');
        setLogs(filtered);
      }
    } catch (err) {
      console.error('Failed to load user QR logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCopyPayload = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQr = (id: string, title: string) => {
    const container = document.getElementById(`qr-canvas-${id}`);
    const canvas = container?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-qrcode.png`;
      a.href = url;
      a.click();
    }
  };

  const formatDateTime = (isoStr: string) => {
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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'url': return <ExternalLink className="w-4 h-4 text-blue-500" />;
      case 'plain-text': return <File className="w-4 h-4 text-slate-500" />;
      case 'contact': return <User className="w-4 h-4 text-emerald-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'app': return <AppWindow className="w-4 h-4 text-purple-500" />;
      case 'location': return <MapPin className="w-4 h-4 text-amber-500" />;
      case 'sms': return <MessageSquare className="w-4 h-4 text-teal-500" />;
      case 'email': return <Mail className="w-4 h-4 text-indigo-500" />;
      case 'phone': return <Phone className="w-4 h-4 text-green-500" />;
      case 'social': return <Share2 className="w-4 h-4 text-pink-500" />;
      default: return <QrCode className="w-4 h-4 text-emerald-600" />;
    }
  };

  // Types list for filters
  const uniqueTypes = useMemo(() => {
    const types = Array.from(new Set(logs.map(l => l.qrType.toLowerCase())));
    return ['ALL', ...types];
  }, [logs]);

  // Filtered QR logs
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const matchesType = selectedType === 'ALL' || item.qrType.toLowerCase() === selectedType.toLowerCase();
      const matchesSearch = 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payload.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.qrType.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [logs, selectedType, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenActivity={() => {}}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          if (user) setAuthModalOpen(false);
        }}
        preventClose={!user}
        onSuccess={(newUser) => {
          setUser(newUser);
          setAuthModalOpen(false);
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header and CRM Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Generator</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Krisha CRM Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Saved QR Codes
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Manage your verified QR assets, view real-time creation timestamps, and download vector-ready PNGs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
              title="Refresh QRs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate New QR</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-8 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, payload or type..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  selectedType.toLowerCase() === type.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* QR List Grid */}
        {loading && logs.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-500">Loading your QR portfolio...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No QR Codes Found</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              {searchTerm || selectedType !== 'ALL'
                ? "No saved QR codes match your filter criteria."
                : "You haven't saved or downloaded any QR codes yet in Krisha CRM."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your First QR</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogs.map((log) => {
              const dt = formatDateTime(log.createdAt);
              return (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col group relative"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-emerald-50 transition-colors">
                        {getTypeIcon(log.qrType)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                          {log.title || `${log.qrType.toUpperCase()} QR`}
                        </h3>
                        <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {log.qrType}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {log.action}
                    </span>
                  </div>

                  {/* QR Canvas Center */}
                  <div 
                    id={`qr-canvas-${log.id}`} 
                    className="p-4 bg-slate-50/80 rounded-2xl flex items-center justify-center my-2 border border-slate-100"
                  >
                    <QRCodeCanvas
                      value={log.payload}
                      size={170}
                      level="H"
                      includeMargin={false}
                      fgColor="#0f172a"
                    />
                  </div>

                  {/* Payload Details */}
                  <div className="mt-3 space-y-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[11px] font-mono text-slate-700 break-all line-clamp-2 select-all">
                        {log.payload}
                      </p>
                    </div>

                    {/* Date and Time Audit */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {dt.datePart}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {dt.timePart}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleCopyPayload(log.id, log.payload)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
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

                    <button
                      onClick={() => handleDownloadQr(log.id, log.title || log.qrType)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
