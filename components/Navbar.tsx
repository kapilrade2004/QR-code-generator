"use client";

import React from 'react';
import Link from 'next/link';
import { 
  QrCode, LogIn, LogOut, History, Sparkles, Building2, 
  ExternalLink, Layers, ShieldCheck 
} from 'lucide-react';

interface NavbarProps {
  user: { id: string; email: string; name?: string } | null;
  onOpenAuth: () => void;
  onOpenActivity: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onOpenAuth, onOpenActivity, onLogout }: NavbarProps) {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* QR Studio Branding */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  QR Studio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span>Enterprise QR Generator</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-emerald-600 font-semibold">Real-time Analytics</span>
              </p>
            </div>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/my-qrs"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/70 transition border border-slate-200 shadow-xs"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">My Saved QRs</span>
                <span className="sm:hidden">My QRs</span>
              </Link>

              <button
                onClick={onOpenActivity}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/70 transition border border-slate-200 shadow-xs"
              >
                <History className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Audit Logs</span>
                <span className="sm:hidden">Logs</span>
              </button>

              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.name || 'Account'}</span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[130px] font-medium">{user.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to QR Studio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
