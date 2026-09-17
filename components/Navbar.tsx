"use client";

import React from 'react';
import { QrCode, LogIn, LogOut, History, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: { id: string; email: string; name?: string } | null;
  onOpenAuth: () => void;
  onOpenActivity: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onOpenAuth, onOpenActivity, onLogout }: NavbarProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
              QR Studio
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Generator & Activity Tracker
            </p>
          </div>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={onOpenActivity}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition border border-slate-200"
              >
                <History className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Activity Logs</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800">{user.name || 'User'}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenActivity}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Logs</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
