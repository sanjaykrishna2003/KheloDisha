import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  PlusCircle,
  Users,
  ShieldCheck,
  AlertTriangle,
  Building,
  Calendar
} from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

export default function TeacherPortalScreen({ lang }) {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'facilities' | 'confirm_reports'
  const [facilities, setFacilities] = useState([]);
  const [unconfirmedReports, setUnconfirmedReports] = useState([]);

  // Attendance Form State
  const [attForm, setAttForm] = useState({
    facility_id: 'FAC-B1',
    locality_id: 'LOC-BLOCK-B',
    sport: 'badminton',
    date: new Date().toISOString().split('T')[0],
    attendee_count: 35,
    girls_count: 7
  });

  // New Facility Form State
  const [facForm, setFacForm] = useState({
    locality_id: 'LOC-BLOCK-B',
    name: 'Bargaon Panchayat Badminton Court',
    lat: 22.185,
    lon: 84.352,
    sports: 'badminton',
    equipment_ok: true,
    coach_present: true,
    weekly_sessions: 3,
    participants_per_session: 15,
    fee_level: 'free'
  });

  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      const facRes = await apiRequest('/facilities?sport=badminton');
      setFacilities(facRes.facilities || []);

      const repRes = await apiRequest('/reports/locality/LOC-BLOCK-B?sport=badminton');
      setUnconfirmedReports(repRes.reports || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify(attForm)
      });
      setMessage('Session attendance recorded! Feeds into block attendance tracking and difference-in-differences impact evaluation.');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFacilitySubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/facilities', {
        method: 'POST',
        body: JSON.stringify(facForm)
      });
      setMessage('Facility added to official registry with Teacher-Confirmed status.');
      loadData();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmReport = async (reportId) => {
    try {
      await apiRequest(`/reports/${reportId}/confirm`, {
        method: 'PUT'
      });
      setMessage('Report confirmed! Trust weight elevated to 0.8 (Teacher-Confirmed).');
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-black">
              {lang === 'or' ? 'ଶିକ୍ଷକ ଓ ଖେଳ ଶିକ୍ଷକ ପୋର୍ଟାଲ' : 'Physical Education Teacher & Coach Portal'}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          Teacher-verified ground reports carry a 0.8 trust weight (overcoming self-reported noise). You can log session attendance, manage facility verification, and confirm ground barriers.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeSubTab === 'attendance'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-400" />
          <span>Log Session Attendance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('facilities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeSubTab === 'facilities'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-teal-400" />
          <span>Facility Registry ({facilities.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('confirm_reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeSubTab === 'confirm_reports'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Confirm Barrier Reports</span>
        </button>
      </div>

      {/* TAB 1: ATTENDANCE ENTRY */}
      {activeSubTab === 'attendance' && (
        <form onSubmit={handleAttendanceSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Record Weekly Badminton Training Attendance</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Facility Ground</label>
              <select
                value={attForm.facility_id}
                onChange={(e) => setAttForm({ ...attForm, facility_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.fee_level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
              <input
                type="date"
                value={attForm.date}
                onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Regular Attendees</label>
              <input
                type="number"
                min="0"
                value={attForm.attendee_count}
                onChange={(e) => setAttForm({ ...attForm, attendee_count: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Girls Present (Female Count)</label>
              <input
                type="number"
                min="0"
                value={attForm.girls_count}
                onChange={(e) => setAttForm({ ...attForm, girls_count: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-teal-700"
                required
              />
              <span className="text-[11px] text-slate-500">
                Equity Share: {attForm.attendee_count > 0 ? Math.round((attForm.girls_count / attForm.attendee_count) * 100) : 0}% (Target is 50%)
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow-md transition"
          >
            Submit Verified Attendance
          </button>
        </form>
      )}

      {/* TAB 2: FACILITY REGISTRY */}
      {activeSubTab === 'facilities' && (
        <div className="space-y-6">
          <form onSubmit={handleFacilitySubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              <span>Register / Verify Sports Ground</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  value={facForm.name}
                  onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Locality Block</label>
                <select
                  value={facForm.locality_id}
                  onChange={(e) => setFacForm({ ...facForm, locality_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                >
                  <option value="LOC-BLOCK-B">Bargaon Block (Block B)</option>
                  <option value="LOC-BLOCK-A">Kutra Block (Block A)</option>
                  <option value="LOC-BLOCK-D">Balishankara Block (Block D)</option>
                  <option value="LOC-BLOCK-C">Subdega Block (Block C)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fee Level</label>
                <select
                  value={facForm.fee_level}
                  onChange={(e) => setFacForm({ ...facForm, fee_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                >
                  <option value="free">Free (ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା)</option>
                  <option value="nominal">Nominal Maintenance Fee</option>
                  <option value="expensive">Commercial / Expensive</option>
                </select>
              </div>

              <div className="flex items-center gap-6 sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facForm.coach_present}
                    onChange={(e) => setFacForm({ ...facForm, coach_present: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>Coach Present (କୋଚ୍ ଉପସ୍ଥିତ)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facForm.equipment_ok}
                    onChange={(e) => setFacForm({ ...facForm, equipment_ok: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>Equipment OK (ଉପକରଣ ଉପଯୁକ୍ତ)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition"
            >
              Save Ground to Registry
            </button>
          </form>

          {/* Existing Facilities List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Current Facility Directory</h3>
            <div className="divide-y divide-slate-100">
              {facilities.map(f => (
                <div key={f.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{f.name}</div>
                    <div className="text-xs text-slate-500">
                      {f.locality_id} • Fee: <span className="capitalize">{f.fee_level}</span> • Weekly Capacity: {f.weekly_sessions * f.participants_per_session}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      f.is_usable ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {f.is_usable ? 'Usable (Coach + Equip OK)' : 'Lacks Coach or Equip'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                      {f.verification_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIRM BARRIER REPORTS */}
      {activeSubTab === 'confirm_reports' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Student & Parent Barrier Reports in Bargaon Block</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
              Showing recent reports
            </span>
          </h3>

          <div className="divide-y divide-slate-100">
            {unconfirmedReports.slice(0, 10).map((r) => (
              <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 capitalize">{r.category.replace('_', ' ')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'teacher_confirmed' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Trust: {r.trust_level} ({r.status})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Reported on {r.date} • {r.notes || 'No description provided'}
                  </div>
                </div>

                {r.status !== 'teacher_confirmed' && r.status !== 'officer_verified' && (
                  <button
                    onClick={() => handleConfirmReport(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>Confirm Ground Truth</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
