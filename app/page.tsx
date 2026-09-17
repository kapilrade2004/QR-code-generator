"use client"

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Link as LinkIcon, FileText, User, File, AppWindow, MessageSquare, Mail, Phone, Share2, 
  Download, Copy, Palette, CheckCircle, Volume2, MapPin, UploadCloud
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import ActivityModal, { QrLogItem } from '@/components/ActivityModal';

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
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState('url');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Fetch logged in user on mount - Enforce login first
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

  const logQrAction = async (action: 'GENERATED' | 'DOWNLOADED' | 'COPIED', payloadValue: string) => {
    if (!user) return;
    try {
      await fetch('/api/qr/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrType: activeTab,
          payload: payloadValue,
          title: `${activeTab.toUpperCase()} QR`,
          action
        })
      });
    } catch (err) {
      console.error('Failed to log QR action:', err);
    }
  };

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

  // Determine QR Value
  let qrValue = 'https://example.com';
  if (activeTab === 'url') {
    qrValue = url || 'https://example.com';
  } else if (activeTab === 'plain-text') {
    qrValue = text || 'Your text here';
  } else if (activeTab === 'contact') {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${contact.lastName};${contact.firstName};;${contact.prefix};\nFN:${contact.prefix} ${contact.firstName} ${contact.lastName}\nORG:${contact.org}\nTITLE:${contact.title}\nTEL;TYPE=CELL:${contact.mobile}\nTEL;TYPE=HOME:${contact.homePhone}\nTEL;TYPE=FAX:${contact.fax}\nEMAIL:${contact.email}\nADR;TYPE=WORK:;;${contact.street};${contact.city};${contact.state};${contact.postcode};${contact.country}\nURL:${contact.website}\nEND:VCARD`;
    qrValue = contact.firstName ? vcard : 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD';
  } else if (activeTab === 'app') {
    qrValue = appUrls.fallback || appUrls.android || appUrls.ios || 'https://example.com';
  } else if (activeTab === 'location') {
    qrValue = locationStr ? `https://maps.google.com/?q=${encodeURIComponent(locationStr)}` : 'https://maps.google.com/';
  } else if (activeTab === 'pdf') {
    qrValue = pdfUrl || 'https://example.com/sample.pdf';
  } else {
    // Fallback for others
    qrValue = url || 'https://example.com';
  }

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const u = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = 'qrcode.png';
      a.href = u;
      a.click();
      logQrAction('DOWNLOADED', qrValue);
    }
  };

  const handleCopy = async () => {
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

  const handleSave = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    await logQrAction('GENERATED', qrValue);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLoadFromHistory = (item: QrLogItem) => {
    if (tabs.some(t => t.id === item.qrType)) {
      setActiveTab(item.qrType);
    }
    if (item.qrType === 'url') {
      setUrl(item.payload);
    } else if (item.qrType === 'plain-text') {
      setText(item.payload);
    } else if (item.qrType === 'location') {
      const loc = item.payload.replace('https://maps.google.com/?q=', '');
      setLocationStr(decodeURIComponent(loc));
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
        // tmpfiles returns e.g. https://tmpfiles.org/12345/filename.pdf
        // the direct download link is https://tmpfiles.org/dl/12345/filename.pdf
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
        onSelectQr={handleLoadFromHistory}
      />

      {/* If loading authentication status */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 text-sm font-medium">Checking authentication...</p>
        </div>
      ) : !user ? (
        /* If user is not logged in - Restrict screen */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              QR
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Please sign in or create an account to access the QR Code Generator and tracking tools.
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
        /* When logged in - Allow using the service */
        <main className="p-4 md:p-8 flex-1 flex items-start justify-center overflow-auto">
        <div className="max-w-6xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8">
          
          {/* Left Side (Controls) */}
          <div className="flex-1 flex flex-col space-y-8 min-w-0">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl min-w-[72px] transition-all
                    ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
            
            {/* --- URL TAB --- */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <h2 className="text-slate-800 text-2xl font-bold">Redirect to an existing web URL</h2>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/20 text-lg font-medium shadow-inner"
                    placeholder="Enter URL"
                  />
                  <Volume2 className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 cursor-pointer hover:text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm pl-2">Try something like <span className="text-emerald-400">https://example.com/</span></p>
              </div>
            )}

            {/* --- PDF TAB --- */}
            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <h2 className="text-slate-800 text-2xl font-bold">Upload a PDF document</h2>
                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <span className="text-slate-800 font-medium">{isUploading ? 'Uploading securely...' : 'Click to upload PDF'}</span>
                  <span className="text-slate-500 text-sm mt-1">Maximum size: 10MB</span>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    onChange={handlePdfUpload} 
                    disabled={isUploading}
                  />
                </label>
                {pdfName && <p className="text-emerald-600 text-sm pl-2 font-medium">Selected: {pdfName} {isUploading && '(Uploading...)'}</p>}
                {pdfUrl && <p className="text-emerald-300 text-xs pl-2 font-medium break-all">Live Link: <a href={pdfUrl} target="_blank" className="underline hover:text-slate-800">{pdfUrl}</a></p>}
              </div>
            )}

            {/* --- CONTACT TAB --- */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h2 className="text-slate-800 text-2xl font-bold mb-6">Share contact details easily</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Prefix</label>
                      <input type="text" value={contact.prefix} onChange={e => updateContact('prefix', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Last Name</label>
                      <input type="text" value={contact.lastName} onChange={e => updateContact('lastName', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Title</label>
                      <input type="text" value={contact.title} onChange={e => updateContact('title', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Mobile</label>
                      <input type="tel" value={contact.mobile} onChange={e => updateContact('mobile', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Fax</label>
                      <input type="tel" value={contact.fax} onChange={e => updateContact('fax', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">City</label>
                      <input type="text" value={contact.city} onChange={e => updateContact('city', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Postcode</label>
                      <input type="text" value={contact.postcode} onChange={e => updateContact('postcode', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Website/URL/Social</label>
                      <input type="url" value={contact.website} onChange={e => updateContact('website', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">First Name</label>
                      <input type="text" value={contact.firstName} onChange={e => updateContact('firstName', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Organization</label>
                      <input type="text" value={contact.org} onChange={e => updateContact('org', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Email</label>
                      <input type="email" value={contact.email} onChange={e => updateContact('email', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Home Phone</label>
                      <input type="tel" value={contact.homePhone} onChange={e => updateContact('homePhone', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Street</label>
                      <input type="text" value={contact.street} onChange={e => updateContact('street', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">State/Region</label>
                      <input type="text" value={contact.state} onChange={e => updateContact('state', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm font-semibold mb-1 block">Country</label>
                      <input type="text" value={contact.country} onChange={e => updateContact('country', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- PLAIN TEXT TAB --- */}
            {activeTab === 'plain-text' && (
              <div className="space-y-4">
                <h2 className="text-slate-800 text-2xl font-bold">Display a short message</h2>
                <label className="text-slate-800 font-semibold block mt-4">Add message</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/20 text-lg font-medium shadow-inner min-h-[160px] resize-none"
                  placeholder="Enter text here"
                />
              </div>
            )}

            {/* --- APP TAB --- */}
            {activeTab === 'app' && (
              <div className="space-y-6">
                <h2 className="text-slate-800 text-2xl font-bold">Redirect to app download based on the device OS</h2>
                <p className="text-slate-500 text-sm"><span className="text-red-400">*</span> Indicates required field</p>
                
                <div className="space-y-6 mt-4">
                  <div>
                    <label className="text-slate-700 font-semibold block text-lg mb-1">URL for Android</label>
                    <input type="url" value={appUrls.android} onChange={e => updateApp('android', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-2 text-lg" />
                    <p className="text-slate-500 text-xs mt-1">e.g. https://play.google.com/store/apps/details?id=com.google.android.apps.maps</p>
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block text-lg mb-1">URL for iOS</label>
                    <input type="url" value={appUrls.ios} onChange={e => updateApp('ios', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-2 text-lg" />
                    <p className="text-slate-500 text-xs mt-1">e.g. https://apps.apple.com/us/app/google-maps/id585027354</p>
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block text-lg mb-1">URL for other devices <span className="text-red-400">*</span></label>
                    <input type="url" value={appUrls.fallback} onChange={e => updateApp('fallback', e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-2 text-lg" />
                    <p className="text-slate-500 text-xs mt-1">e.g. https://maps.google.com</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- LOCATION TAB --- */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                <h2 className="text-slate-800 text-2xl font-bold">Show a location on Google Maps</h2>
                <label className="text-slate-700 font-semibold block text-lg mb-1 mt-6">Search on Google Maps</label>
                <input
                  type="text"
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-2 text-lg mb-4"
                  placeholder="Try searching for a landmark, street, or address"
                />
                <div className="w-full h-64 bg-slate-200 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Manhattan,NY&zoom=13&size=600x300&maptype=roadmap')] bg-cover bg-center opacity-50 mix-blend-luminosity"></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" />
                  </div>
                </div>
              </div>
            )}

            {/* Default Catch-all for remaining unstyled tabs */}
            {!['url', 'pdf', 'contact', 'plain-text', 'app', 'location'].includes(activeTab) && (
              <div className="space-y-4">
                <h2 className="text-slate-800 text-2xl font-bold capitalize">{activeTab} Details</h2>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 outline-none focus:border-emerald-500 py-2 text-lg"
                  placeholder={`Enter ${activeTab} details...`}
                />
              </div>
            )}

          </div>

          <div className="flex gap-8 mt-auto pt-6 border-t border-slate-700/50">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-400 transition-colors">Track your scans ✨</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-400 transition-colors">Remove watermark ✨</span>
            </label>
          </div>
        </div>

        {/* Right Side (QR Preview) */}
        <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-4">
          <div className="flex justify-end">
            <span className="text-xs text-slate-500">
              To enable tracking, <a href="#" className="text-slate-800 underline hover:text-emerald-600">create a Dynamic QR Code</a>
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg relative min-h-[340px]">
            <div ref={qrRef} className="p-4 bg-white rounded-2xl">
              <QRCodeCanvas 
                value={qrValue} 
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
              />
            </div>
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
               <div className="w-10 h-10 border-2 border-emerald-500 rounded-lg p-1 bg-white cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"><QRCodeCanvas value="1" size={24} level="L" fgColor="#0f172a"/></div>
               <div className="w-10 h-10 border border-slate-200 rounded-lg p-1 bg-white cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"><QRCodeCanvas value="2" size={24} level="L" fgColor="#2563eb"/></div>
               <div className="w-10 h-10 border border-slate-200 rounded-lg p-1 bg-white cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"><QRCodeCanvas value="3" size={24} level="L" fgColor="#ef4444"/></div>
            </div>
          </div>

          {activeTab === 'location' ? (
            <div className="flex flex-col gap-2">
              <button className="w-full bg-[#5d9b3d] hover:bg-[#4d8232] text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors">
                Next
              </button>
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2 border border-blue-100 mt-2">
                <span className="font-bold border border-blue-800 rounded-full w-4 h-4 flex items-center justify-center shrink-0">i</span>
                <span>Your QR Code isn't ready yet. Add content and click <b>Next</b> to generate it.</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 h-12">
              <button 
                onClick={handleSave}
                className={`flex-1 font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-slate-200 hover:bg-white text-slate-800'
                }`}
              >
                {saveSuccess ? 'Saved to Logs!' : 'Save'}
              </button>
              <button onClick={handleDownload} className="w-12 bg-slate-200 hover:bg-white text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer" title="Download">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={handleCopy} className="w-12 bg-slate-200 hover:bg-white text-slate-600 rounded-xl flex items-center justify-center transition-colors relative cursor-pointer" title="Copy to Clipboard">
                {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
              <button className="w-12 bg-slate-200 hover:bg-white text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer" title="Customize">
                <Palette className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

      </div>
      </main>
      )}
    </div>
  );
}
