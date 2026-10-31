import React, { useState, useEffect } from 'react';
import { FileText, Shield, Clock, Search, User } from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

export default function AuditLogScreen({ lang }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const query = filterAction ? `?action=${encodeURIComponent(filterAction)}` : '';
        const res = await apiRequest(`/audit${query}`);
        setLogs(res.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filterAction]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-black">
              {lang === 'or' ? 'ପ୍ରଶାସକ ଅଡିଟ୍ ଲଗ୍ ନିରୀକ୍ଷଣ' : 'Administrative Audit Trail & Security Logs'}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          Mandatory compliance log: Immutable record capturing every creation, parental consent verification, officer approval, status transition, and proof confirmation.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit actions (e.g. CONSENT, APPROVE, PROOF, LOGIN)..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full text-xs font-medium focus:outline-none"
        />
        {filterAction && (
          <button
            onClick={() => setFilterAction('')}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-navy-100 text-navy-900 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{log.user_id || 'System'}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{log.user_role}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium capitalize">
                    {log.entity_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {log.entity_id || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
