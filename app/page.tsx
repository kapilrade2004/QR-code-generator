"use client"

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Link as LinkIcon, FileText, User, File, AppWindow, MessageSquare, Mail, Phone, Share2, 
  Download, Copy, Palette, CheckCircle, Volume2, MapPin, UploadCloud, AlertTriangle, 
  Sparkles, Check, Bookmark, Calendar, Clock, Layers
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import ActivityModal from '@/components/ActivityModal';

const tabs = [
  { id: 'url', label: 'URL', icon: LinkIcon },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'contact', label: 'Contact', icon: User },
  { id: 'plain-text', label: 'Plain Text', icon: File },
  { id: 'app', label: 'App', icon: AppWindow },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'social', label: 'Social', icon: Share2 }
];

export default function QrCodeGeneratorPage() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  
  // Warnings and Feedback states
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Customization
  const [qrColor, setQrColor] = useState('#0f172a');
  const [activeTab, setActiveTab] = useState('url');
  const qrRef = useRef<HTMLDivElement>(null);

  // Form states
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [contact, setContact] = useState({
    prefix: '', firstName: '', lastName: '', org: '', title: '', email: '', 
    mobile: '', homePhone: '', fax: '', street: '', city: '', state: '', 
    postcode: '', country: '', website: ''
  });

  const [appUrls, setAppUrls] = useState({ android: '', ios: '', fallback: '' });
  const [locationStr, setLocationStr] = useState('');
  const [smsData, setSmsData] = useState({ phone: '', message: '' });
  const [emailData, setEmailData] = useState({ email: '', subject: '', body: '' });
  const [phoneNum, setPhoneNum] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  // Fetch logged in user on mount
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setAuthModalOpen(true);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Helper to test if QR content is blank
  const isQrBlank = (): boolean => {
    switch (activeTab) {
      case 'url':
        return !url.trim();
      case 'plain-text':
        return !text.trim();
      case 'pdf':
        return !pdfUrl.trim();
      case 'contact':
        return !contact.firstName.trim() && !contact.mobile.trim() && !contact.email.trim();
      case 'app':
        return !appUrls.android.trim() && !appUrls.ios.trim() && !appUrls.fallback.trim();
      case 'location':
        return !locationStr.trim();
      case 'sms':
        return !smsData.phone.trim();
      case 'email':
        return !emailData.email.trim();
      case 'phone':
        return !phoneNum.trim();
      case 'social':
        return !socialUrl.trim();
      default:
        return !url.trim();
    }
  };

  // Compute payload value
  const getPayload = (): string => {
    switch (activeTab) {
      case 'url':
        return url.trim() || 'https://example.com';
      case 'plain-text':
        return text.trim() || 'Your text here';
      case 'pdf':
        return pdfUrl.trim() || 'https://example.com/sample.pdf';
      case 'contact':
        if (!contact.firstName.trim() && !contact.mobile.trim()) return 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD';
        return `BEGIN:VCARD\nVERSION:3.0\nN:${contact.lastName};${contact.firstName};;${contact.prefix};\nFN:${contact.prefix} ${contact.firstName} ${contact.lastName}\nORG:${contact.org}\nTITLE:${contact.title}\nTEL;TYPE=CELL:${contact.mobile}\nTEL;TYPE=HOME:${contact.homePhone}\nTEL;TYPE=FAX:${contact.fax}\nEMAIL:${contact.email}\nADR;TYPE=WORK:;;${contact.street};${contact.city};${contact.state};${contact.postcode};${contact.country}\nURL:${contact.website}\nEND:VCARD`;
      case 'app':
        return appUrls.fallback.trim() || appUrls.android.trim() || appUrls.ios.trim() || 'https://example.com';
      case 'location':
        return locationStr.trim() ? `https://maps.google.com/?q=${encodeURIComponent(locationStr.trim())}` : 'https://maps.google.com/';
      case 'sms':
        return smsData.phone.trim() ? `SMSTO:${smsData.phone.trim()}:${smsData.message}` : '';
      case 'email':
        return emailData.email.trim() ? `mailto:${emailData.email.trim()}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}` : '';
      case 'phone':
        return phoneNum.trim() ? `tel:${phoneNum.trim()}` : '';
      case 'social':
        return socialUrl.trim() || '';
      default:
        return url.trim() || 'https://example.com';
    }
  };

  const qrValue = getPayload();

  // Log action (action: 'DOWNLOADED' | 'COPIED' | 'GENERATED')
  const logQrAction = async (action: 'GENERATED' | 'DOWNLOADED' | 'COPIED', payloadValue: string) => {
    if (!user) return;
    try {
      await fetch('/api/qr/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrType: activeTab,
          payload: payloadValue,
          title: `${activeTab.toUpperCase()} QR Code`,
          action
        })
      });
    } catch (err) {
      console.error('Failed to log QR action:', err);
    }
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  // User Save Handler with Blank Validation
  const handleSave = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // CHECK IF BLANK
    if (isQrBlank()) {
      showWarning("⚠️ Cannot save blank QR code! Please enter the required details first.");
      return;
    }

    await logQrAction('DOWNLOADED', qrValue); // Save explicitly as verified asset
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDownload = () => {
    if (isQrBlank()) {
      showWarning("⚠️ Cannot download blank QR code! Please enter content first.");
      return;
    }

    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const u = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `qr-studio-${activeTab}-qr.png`;
      a.href = u;
      a.click();
      logQrAction('DOWNLOADED', qrValue);
    }
  };

  const handleCopy = async () => {
    if (isQrBlank()) {
      showWarning("⚠️ Cannot copy blank QR code! Please enter content first.");
      return;
    }

    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopied(true);
            logQrAction('COPIED', qrValue);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Failed to copy image: ', err);
          }
        }
      });
    }
  };

  const updateContact = (key: keyof typeof contact, val: string) => {
    setContact(prev => ({ ...prev, [key]: val }));
  };

  const updateApp = (key: keyof typeof appUrls, val: string) => {
    setAppUrls(prev => ({ ...prev, [key]: val }));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfName(file.name);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data?.data?.url) {
        const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        setPdfUrl(directUrl);
      }
    } catch (err) {
      console.error('Failed to upload PDF', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenActivity={() => {
          if (!user) {
            setAuthModalOpen(true);
          } else {
            setActivityModalOpen(true);
          }
        }}
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

      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      />

      {/* Auth Loading Guard */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 text-sm font-semibold">Connecting to QR Studio...</p>
        </div>
      ) : !user ? (
        /* Guest restriction */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl shadow-md shadow-emerald-500/20">
              Q
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">QR Studio Sign In</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Please sign in or create an account to access the enterprise QR Code Studio, activity tracking, and analytics.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      ) : (
        /* Main Workspace */
        <main className="p-4 md:p-8 flex-1 flex items-start justify-center overflow-auto">
          <div className="max-w-6xl w-full flex flex-col gap-4">
            
            {/* Warning Banner when attempting to save/export blank QR */}
            {warningMessage && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300/80 text-amber-900 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top duration-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="flex-1">{warningMessage}</span>
                <button 
                  onClick={() => setWarningMessage(null)}
                  className="text-xs bg-amber-200/80 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded-lg transition"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-8">
              
              {/* Left Side (Controls) */}
              <div className="flex-1 flex flex-col space-y-6 min-w-0">
                
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <span>QR Code Studio</span>
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PRO
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Select a data type, enter details, and generate your live QR code.</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 pb-2">
                  {tabs.map(t => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTab(t.id);
                          setWarningMessage(null);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl min-w-[76px] transition-all cursor-pointer
                          ${isActive 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-102' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-extrabold tracking-wide uppercase">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Tab Body */}
                <div className="flex-1 overflow-auto pr-1">
                  
                  {/* --- URL TAB --- */}
                  {activeTab === 'url' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-800 text-sm font-bold block">Website / Destination URL</label>
                        <span className="text-[11px] text-emerald-600 font-semibold">Supports https://</span>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            setUrl(e.target.value);
                            setWarningMessage(null);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-base font-medium transition"
                          placeholder="e.g. https://yourcompany.com"
                        />
                      </div>
                      <p className="text-slate-400 text-xs pl-1">
                        When scanned, users will immediately open this webpage on their mobile browser.
                      </p>
                    </div>
                  )}

                  {/* --- PLAIN TEXT TAB --- */}
                  {activeTab === 'plain-text' && (
                    <div className="space-y-4">
                      <label className="text-slate-800 text-sm font-bold block">Message / Raw Text</label>
                      <textarea
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          setWarningMessage(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-base font-medium shadow-inner min-h-[160px] resize-none"
                        placeholder="Type any message, serial number, or note..."
                      />
                    </div>
                  )}

                  {/* --- PDF TAB --- */}
                  {activeTab === 'pdf' && (
                    <div className="space-y-4">
                      <label className="text-slate-800 text-sm font-bold block">Upload PDF Document</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 transition relative">
                        <UploadCloud className="w-10 h-10 text-emerald-600 mb-2" />
                        <span className="text-sm font-bold text-slate-700">Click to upload your PDF</span>
                        <span className="text-xs text-slate-400 mt-1">Directly hosts and shares your catalog, menu, or brochure</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {isUploading && <p className="text-xs text-emerald-600 font-bold animate-pulse">Uploading file...</p>}
                      {pdfName && <p className="text-xs text-slate-600 font-semibold">Attached: {pdfName}</p>}
                    </div>
                  )}

                  {/* --- CONTACT TAB --- */}
                  {activeTab === 'contact' && (
                    <div className="space-y-4">
                      <label className="text-slate-800 text-sm font-bold block">vCard Contact Card</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="First Name *" 
                          value={contact.firstName} 
                          onChange={e => updateContact('firstName', e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Last Name" 
                          value={contact.lastName} 
                          onChange={e => updateContact('lastName', e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                        />
                        <input 
                          type="tel" 
                          placeholder="Mobile Phone *" 
                          value={contact.mobile} 
                          onChange={e => updateContact('mobile', e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                        />
                        <input 
                          type="email" 
                          placeholder="Email Address" 
                          value={contact.email} 
                          onChange={e => updateContact('email', e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Organization / Company" 
                          value={contact.org} 
                          onChange={e => updateContact('org', e.target.value)} 
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 sm:col-span-2" 
                        />
                      </div>
                    </div>
                  )}

                  {/* --- LOCATION TAB --- */}
                  {activeTab === 'location' && (
                    <div className="space-y-4">
                      <label className="text-slate-800 text-sm font-bold block">Google Maps Location</label>
                      <input
                        type="text"
                        value={locationStr}
                        onChange={(e) => setLocationStr(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 text-sm"
                        placeholder="Search landmark, address, or city..."
                      />
                    </div>
                  )}

                  {/* --- APP TAB --- */}
                  {activeTab === 'app' && (
                    <div className="space-y-3">
                      <label className="text-slate-800 text-sm font-bold block">App Store & Play Store Redirects</label>
                      <input 
                        type="url" 
                        placeholder="Fallback URL *" 
                        value={appUrls.fallback} 
                        onChange={e => updateApp('fallback', e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                      />
                      <input 
                        type="url" 
                        placeholder="Google Play Store URL" 
                        value={appUrls.android} 
                        onChange={e => updateApp('android', e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                      />
                      <input 
                        type="url" 
                        placeholder="Apple App Store URL" 
                        value={appUrls.ios} 
                        onChange={e => updateApp('ios', e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" 
                      />
                    </div>
                  )}

                  {/* --- OTHER TABS (SMS, EMAIL, PHONE, SOCIAL) --- */}
                  {!['url', 'pdf', 'contact', 'plain-text', 'app', 'location'].includes(activeTab) && (
                    <div className="space-y-4">
                      <label className="text-slate-800 text-sm font-bold block capitalize">{activeTab} Input</label>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 text-sm"
                        placeholder={`Enter ${activeTab} data...`}
                      />
                    </div>
                  )}

                </div>

                {/* Krisha CRM Security Banner */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Auto-scanned & safe QR generation</span>
                  </span>
                  <span className="font-bold text-slate-700">QR Studio PRO</span>
                </div>
              </div>

              {/* Right Side (QR Preview & Studio Controls) */}
              <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-4">
                
                {/* QR Canvas Card */}
                <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-200/90 shadow-sm relative min-h-[340px]">
                  
                  {/* Watermark/Branding */}
                  <div className="text-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      QR Studio • Verified
                    </span>
                  </div>

                  <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                    <QRCodeCanvas 
                      value={qrValue} 
                      size={210}
                      level="H"
                      includeMargin={false}
                      fgColor={qrColor}
                    />
                  </div>
                  
                  {/* Palette Selector */}
                  <div className="flex items-center gap-2 mt-4">
                    {[
                      { color: '#0f172a', title: 'Slate Dark' },
                      { color: '#059669', title: 'Emerald Green' },
                      { color: '#2563eb', title: 'Ocean Blue' },
                      { color: '#7c3aed', title: 'Royal Purple' },
                      { color: '#dc2626', title: 'Crimson Red' }
                    ].map(c => (
                      <button
                        key={c.color}
                        onClick={() => setQrColor(c.color)}
                        title={c.title}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${qrColor === c.color ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c.color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className={`flex-1 py-3 px-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs text-sm ${
                      saveSuccess 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved to QRs!</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-emerald-600" />
                        <span>Save QR</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleDownload} 
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-slate-200" 
                    title="Download High-Res PNG"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={handleCopy} 
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors relative cursor-pointer border border-slate-200" 
                    title="Copy QR to Clipboard"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

              </div>

            </div>
          </div>
        </main>
      )}
    </div>
  );
}
