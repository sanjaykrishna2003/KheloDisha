import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, User, Globe, ChevronDown, ShieldCheck } from 'lucide-react';
import SimulatedBadge from './SimulatedBadge';
import { getTotalPendingCount, syncOfflineQueue } from '../services/offlineQueue';
import { t } from '../services/i18n';

const DEMO_ROLES = [
  { key: 'district_officer', label: 'District Sports Officer (Minati Behera)', role: 'officer' },
  { key: 'block_officer', label: 'Block Officer Bargaon (Rakesh Nayak)', role: 'officer' },
  { key: 'teacher_coach', label: 'PET Teacher / Coach (Pradeep Mohanty)', role: 'teacher_coach' },
  { key: 'player_parent', label: 'Parent / Guardian (Manoj Oram)', role: 'player_parent' },
  { key: 'sponsor', label: 'Sponsor CSR (Tata Steel Foundation)', role: 'sponsor' },
  { key: 'public', label: 'Public Scorecard Viewer (Citizen)', role: 'public' },
  { key: 'admin', label: 'State Admin (Debabrata Samal)', role: 'admin' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'or', label: 'ଓଡ଼ିଆ' }
];

export default function Header({
  currentUser,
  onRoleSwitch,
  lang,
  setLang,
  isOnline
}) {
  const [pendingCount, setPendingCount] = useState(getTotalPendingCount());
  const [syncing, setSyncing] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const strings = t(lang);

  useEffect(() => {
    const updateCount = () => setPendingCount(getTotalPendingCount());
    window.addEventListener('offline_queue_changed', updateCount);
    window.addEventListener('online', updateCount);
    window.addEventListener('offline', updateCount);

    return () => {
      window.removeEventListener('offline_queue_changed', updateCount);
      window.removeEventListener('online', updateCount);
      window.removeEventListener('offline', updateCount);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      alert(lang === 'hi' ? 'इंटरनेट उपलब्ध नहीं है। कनेक्शन वापस आने पर स्वतः सिंक हो जाएगा।' : (lang === 'or' ? 'ଇଣ୍ଟରନେଟ ସଂଯୋଗ ନାହିଁ। କନେକ୍ସନ ଆସିଲେ ସ୍ୱୟଂଚାଳିତ ଭାବେ ସିଙ୍କ ହେବ।' : 'Device is offline. Queued items will sync automatically when connection returns.'));
      return;
    }
    setSyncing(true);
    try {
      const res = await syncOfflineQueue();
      setPendingCount(getTotalPendingCount());
      if (res.total > 0) {
        alert(lang === 'hi' ? `${res.total} रिकॉर्ड सफलतापूर्वक सिंक हो गए!` : (lang === 'or' ? `${res.total} ଟି ରେକର୍ଡ ସଫଳତାର ସହ ସିଙ୍କ ହୋଇଛି!` : `Successfully synced ${res.total} offline records to server!`));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-navy-900 text-white shadow-md sticky top-0 z-50">
      {/* Top Notification Bar: Viksit Bharat Mission & Online Status */}
      <div className="bg-navy-950 px-4 py-1.5 text-xs border-b border-navy-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SimulatedBadge />
          <span className="text-saffron-400 font-bold hidden sm:inline">
            🇮🇳 {strings.mission_tagline}
          </span>
          <span className="text-slate-400 hidden md:inline">• {strings.district_pilot}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Online / Offline status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <span className="flex items-center gap-1 text-teal-400 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>{strings.online}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span>{strings.offline}</span>
              </span>
            )}
          </div>

          {/* Pending Sync Count */}
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-saffron-600 hover:bg-saffron-500 text-white font-bold transition animate-pulse"
              title="Click to sync offline reports and attendance"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} {strings.pending_sync}</span>
            </button>
          )}

          {/* Tri-Lingual Language Selector (English / हिन्दी / ଓଡ଼ିଆ) */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 text-slate-200 hover:text-white px-2.5 py-1 rounded-md bg-navy-800 border border-navy-700 transition text-xs font-bold"
            >
              <Globe className="w-3.5 h-3.5 text-saffron-400" />
              <span>{LANGUAGES.find(l => l.code === lang)?.label || 'English'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-slate-900">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 flex items-center justify-between ${
                      lang === l.code ? 'text-teal-700 bg-teal-50' : 'text-slate-800'
                    }`}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar: App Logo + Viksit Bharat @ 2047 Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Khelo Disha App Logo Image */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-auto bg-white rounded-xl p-1 shadow-md border border-slate-200 flex items-center justify-center">
              <img
                src="/khelo-disha-logo.png"
                alt="Khelo Disha Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {strings.app_name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal-900/80 text-teal-300 font-bold border border-teal-700">
                  {lang === 'hi' ? 'निर्णय मंच' : (lang === 'or' ? 'ନିଷ୍ପତ୍ତି ମଞ୍ଚ' : 'Decision Platform')}
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                {strings.sub_title}
              </p>
            </div>
          </div>

          {/* National Mission: Viksit Bharat @ 2047 Logo Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-navy-800">
            <div className="h-11 w-auto bg-white rounded-lg p-1 shadow-sm border border-slate-300 flex items-center">
              <img
                src="/viksit-bharat-logo.png"
                alt="Viksit Bharat @ 2047 Mission"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="text-[11px] leading-tight text-slate-300">
              <div className="font-extrabold text-white">VIKSIT BHARAT @2047</div>
              <div className="text-[10px] text-teal-400 font-medium">National Sports Mission</div>
            </div>
          </div>
        </div>

        {/* Role Switcher Toolbar */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-sm font-medium text-slate-200 transition"
          >
            <User className="w-4 h-4 text-teal-400" />
            <div className="text-left hidden md:block">
              <div className="text-[10px] text-slate-400 capitalize">{currentUser?.role?.replace('_', ' ')}</div>
              <div className="text-xs font-semibold text-white truncate max-w-[150px]">{currentUser?.full_name || 'Switch Role'}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-900">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>{strings.switch_persona}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              </div>
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    onRoleSwitch(r.key);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 flex flex-col transition ${
                    currentUser?.username?.includes(r.key) ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                  }`}
                >
                  <span className="font-semibold text-slate-900">{r.label}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{r.role.replace('_', ' ')} permissions</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
