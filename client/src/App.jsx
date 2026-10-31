import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import OfficerDashboardScreen from './screens/OfficerDashboardScreen';
import LocalityDetailScreen from './screens/LocalityDetailScreen';
import ActionTrackerScreen from './screens/ActionTrackerScreen';
import ImpactViewScreen from './screens/ImpactViewScreen';
import BarrierReportScreen from './screens/BarrierReportScreen';
import PlayerRegistrationScreen from './screens/PlayerRegistrationScreen';
import TeacherPortalScreen from './screens/TeacherPortalScreen';
import PublicScorecardScreen from './screens/PublicScorecardScreen';
import SponsorPortalScreen from './screens/SponsorPortalScreen';
import EarlyWarningScreen from './screens/EarlyWarningScreen';
import AuditLogScreen from './screens/AuditLogScreen';

import {
  getStoredUser,
  setStoredUser,
  setStoredToken,
  apiRequest
} from './services/api';
import { syncOfflineQueue } from './services/offlineQueue';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser() || {
    id: 'USR-OFFICER-DISTRICT',
    username: 'officer.district@khelodisha.gov.in',
    role: 'officer',
    officer_level: 'district',
    full_name: 'Smt. Minati Behera (District Sports Officer)',
    locality_id: 'LOC-BLOCK-B'
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLocalityId, setSelectedLocalityId] = useState(null);
  const [lang, setLang] = useState('en'); // 'en' | 'or'
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network connectivity and auto-sync offline queue
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial silent token bootstrap for default demo officer if needed
    const bootstrapUser = async () => {
      try {
        const res = await apiRequest('/auth/demo-switch', {
          method: 'POST',
          body: JSON.stringify({ role_key: 'district_officer' })
        });
        setStoredToken(res.token);
        setStoredUser(res.user);
        setCurrentUser(res.user);
      } catch (e) {
        // Fallback for offline start
      }
    };
    bootstrapUser();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRoleSwitch = async (roleKey) => {
    try {
      const res = await apiRequest('/auth/demo-switch', {
        method: 'POST',
        body: JSON.stringify({ role_key: roleKey })
      });
      setStoredToken(res.token);
      setStoredUser(res.user);
      setCurrentUser(res.user);

      // Route to appropriate default screen for the new role
      if (roleKey === 'player_parent') {
        setActiveTab('player');
      } else if (roleKey === 'teacher_coach') {
        setActiveTab('teacher');
      } else if (roleKey === 'sponsor') {
        setActiveTab('sponsor');
      } else if (roleKey === 'public') {
        setActiveTab('public');
      } else if (roleKey === 'admin') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('dashboard');
      }
      setSelectedLocalityId(null);
    } catch (err) {
      alert(`Role switch error: ${err.message}`);
    }
  };

  const handleSelectLocality = (locId) => {
    setSelectedLocalityId(locId);
  };

  const handleBackToDashboard = () => {
    setSelectedLocalityId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Universal Header with Simulated Badge, Network Status, Pending Sync, and Role Switcher */}
      <Header
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        lang={lang}
        setLang={setLang}
        isOnline={isOnline}
      />

      {/* Role-Filtered Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedLocalityId(null);
        }}
        userRole={currentUser?.role}
        lang={lang}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {/* Locality Drilldown View (Overrides Dashboard when a block is clicked) */}
        {selectedLocalityId ? (
          <LocalityDetailScreen
            localityId={selectedLocalityId}
            onBack={handleBackToDashboard}
            lang={lang}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <OfficerDashboardScreen
                onSelectLocality={handleSelectLocality}
                lang={lang}
              />
            )}
            {activeTab === 'actions' && (
              <ActionTrackerScreen lang={lang} />
            )}
            {activeTab === 'impact' && (
              <ImpactViewScreen lang={lang} />
            )}
            {activeTab === 'report' && (
              <BarrierReportScreen lang={lang} isOnline={isOnline} />
            )}
            {activeTab === 'player' && (
              <PlayerRegistrationScreen lang={lang} />
            )}
            {activeTab === 'teacher' && (
              <TeacherPortalScreen lang={lang} />
            )}
            {activeTab === 'public' && (
              <PublicScorecardScreen lang={lang} />
            )}
            {activeTab === 'sponsor' && (
              <SponsorPortalScreen lang={lang} />
            )}
            {activeTab === 'alerts' && (
              <EarlyWarningScreen lang={lang} />
            )}
            {activeTab === 'audit' && (
              <AuditLogScreen lang={lang} />
            )}
          </>
        )}
      </main>

      {/* Accessible Footer with Viksit Bharat Mission Branding */}
      <footer className="bg-navy-950 text-slate-400 py-6 border-t border-navy-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-auto bg-white rounded p-1">
              <img src="/viksit-bharat-logo.png" alt="Viksit Bharat @ 2047" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <div className="font-bold text-slate-200">
                KheloDisha (ଖେଳୋଦିଶା / खेलो दिशा)
              </div>
              <div className="text-[11px] text-slate-400">
                National Sports Mission • Viksit Bharat @ 2047 • Khelo India • Govt of Odisha
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>All benchmark data is simulated for methodology testing.</div>
            <div>Child privacy guaranteed by design • Small groups suppressed (&lt;10).</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
