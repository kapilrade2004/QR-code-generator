"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  ArrowLeft, QrCode, Search, Filter, RefreshCw, Calendar, 
  ExternalLink, Copy, Check, Download, AlertCircle, Sparkles, User, FileText, AppWindow, MessageSquare, Mail, Phone, Share2, MapPin, File
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
    setLoading(true);
    try {
      const res = await fetch('/api/qr/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load QR list', err);
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

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQr = (id: string, title?: string) => {
    const canvas = document.getElementById(`qr-canvas-${id}`) as HTMLCanvasElement | null;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${(title || 'qr-code').toLowerCase().replace(/\s+/g, '-')}.png`;
      a.href = url;
      a.click();
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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

      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 text-sm font-medium">Checking authentication...</p>
        </div>
      ) : !user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              QR
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Please sign in to view your saved and generated QR codes.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
          {/* Top Bar Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
                  title="Back to Generator"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    My Generated QR Codes
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    View, search, preview, and download every QR code you generated or saved
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create New QR</span>
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Saved</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{logs.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">QR Types Used</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{Math.max(0, uniqueTypes.length - 1)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Account</span>
              <p className="text-sm font-bold text-slate-800 mt-2 truncate">{user.email}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Sync</span>
              <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                MySQL Connected
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by title, type, or payload..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Types filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
              {uniqueTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer ${
                    selectedType.toLowerCase() === t.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* QR Codes Grid List */}
          {loading && logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm mt-3">Loading your saved QR codes...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No QR codes found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                {searchTerm || selectedType !== 'ALL'
                  ? 'No QR codes matched your current filter or search criteria.'
                  : 'You have not saved or generated any QR codes yet. Start creating your first one now!'}
              </p>
              <Link
                href="/"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-emerald-600/20"
              >
                Go to Generator
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLogs.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          {getTypeIcon(item.qrType)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug truncate max-w-[180px]">
                            {item.title || `${item.qrType.toUpperCase()} QR`}
                          </h3>
                          <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider mt-0.5">
                            {item.qrType}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* QR Preview & Details */}
                    <div className="flex items-center gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 mb-4">
                      <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200">
                        <QRCodeCanvas
                          id={`qr-canvas-${item.id}`}
                          value={item.payload}
                          size={96}
                          level="M"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          QR Content
                        </span>
                        <p className="text-xs text-slate-700 font-mono break-all line-clamp-3 bg-white p-2 rounded-lg border border-slate-200/60">
                          {item.payload}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500">
                      Action: <strong className="text-slate-700 uppercase">{item.action}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(item.id, item.payload)}
                        title="Copy QR Payload"
                        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDownloadQr(item.id, item.title)}
                        title="Download QR Image (PNG)"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs rounded-lg transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
