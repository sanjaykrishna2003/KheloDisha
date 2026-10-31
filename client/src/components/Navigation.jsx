import React from 'react';
import {
  Map,
  CheckSquare,
  BarChart3,
  AlertTriangle,
  UserPlus,
  ClipboardList,
  Award,
  DollarSign,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { t } from '../services/i18n';

export default function Navigation({ activeTab, setActiveTab, userRole, lang }) {
  const strings = t(lang);

  const tabs = [
    {
      id: 'dashboard',
      label: strings.nav.dashboard,
      icon: Map,
      roles: ['officer', 'admin']
    },
    {
      id: 'actions',
      label: strings.nav.actions,
      icon: CheckSquare,
      roles: ['officer', 'teacher_coach', 'admin']
    },
    {
      id: 'impact',
      label: strings.nav.impact,
      icon: BarChart3,
      roles: ['officer', 'sponsor', 'admin']
    },
    {
      id: 'report',
      label: strings.nav.report,
      icon: AlertTriangle,
      roles: ['player_parent', 'teacher_coach', 'officer', 'admin']
    },
    {
      id: 'player',
      label: strings.nav.player,
      icon: UserPlus,
      roles: ['player_parent', 'admin']
    },
    {
      id: 'teacher',
      label: strings.nav.teacher,
      icon: ClipboardList,
      roles: ['teacher_coach', 'admin']
    },
    {
      id: 'public',
      label: strings.nav.public,
      icon: Award,
      roles: ['public', 'player_parent', 'teacher_coach', 'officer', 'sponsor', 'admin']
    },
    {
      id: 'sponsor',
      label: strings.nav.sponsor,
      icon: DollarSign,
      roles: ['sponsor', 'admin']
    },
    {
      id: 'alerts',
      label: strings.nav.alerts,
      icon: ShieldAlert,
      roles: ['officer', 'teacher_coach', 'admin']
    },
    {
      id: 'audit',
      label: strings.nav.audit,
      icon: FileText,
      roles: ['admin']
    }
  ];

  // Filter tabs for the active role
  const visibleTabs = tabs.filter(t => t.roles.includes(userRole || 'public'));

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[89px] z-40 shadow-sm overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 py-2">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-navy-900 text-white shadow-sm ring-2 ring-saffron-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-saffron-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
