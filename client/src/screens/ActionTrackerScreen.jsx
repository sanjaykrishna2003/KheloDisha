import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  Camera,
  MapPin
} from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

const STATUS_COLUMNS = [
  { id: 'approved', label: 'Approved', color: 'border-blue-500 bg-blue-50/50 text-blue-900' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500 bg-amber-50/50 text-amber-900' },
  { id: 'done', label: 'Done (Proof Uploaded)', color: 'border-purple-500 bg-purple-50/50 text-purple-900' },
  { id: 'verified', label: 'Verified & Closed', color: 'border-teal-500 bg-teal-50/50 text-teal-900' }
];

export default function ActionTrackerScreen({ lang }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActionForProof, setSelectedActionForProof] = useState(null);
  const [proofUrl, setProofUrl] = useState('https://khelodisha.gov.in/evidence/van-pilot-01.jpg');
  const [proofLat, setProofLat] = useState('22.182');
  const [proofLon, setProofLon] = useState('84.351');
  const [message, setMessage] = useState(null);

  const loadActions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/actions');
      setActions(res.actions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleStatusChange = async (actionId, newStatus) => {
    try {
      await apiRequest(`/actions/${actionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadActions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!selectedActionForProof) return;

    try {
      await apiRequest(`/actions/${selectedActionForProof.id}/proof`, {
        method: 'POST',
        body: JSON.stringify({
          proof_url: proofUrl,
          proof_lat: parseFloat(proofLat),
          proof_lon: parseFloat(proofLon)
        })
      });

      setMessage("Proof uploaded successfully with geotag and timestamp! Action moved to 'Done' awaiting second confirmation.");
      setSelectedActionForProof(null);
      loadActions();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifySecondConfirmer = async (actionId) => {
    try {
      await apiRequest(`/actions/${actionId}/verify`, {
        method: 'POST'
      });
      setMessage('Action successfully verified by second confirmer! (Two-person rule satisfied).');
      loadActions();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-black">
              {lang === 'or' ? 'କାର୍ଯ୍ୟାନୁଷ୍ଠାନ ଟ୍ରାକର ବୋର୍ଡ' : 'Action Tracker Board'}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          Tracks every intervention through rigorous governance: Approved &rarr; In Progress &rarr; Done (requires photographic evidence + GPS timestamp) &rarr; Verified (mandates an independent second confirmer).
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colActions = actions.filter(a => a.status === col.id || (col.id === 'verified' && a.status === 'closed'));
          return (
            <div key={col.id} className="bg-slate-100 rounded-2xl p-4 flex flex-col border border-slate-200 min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <span className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                  {col.label}
                </span>
                <span className="w-6 h-6 rounded-full bg-white text-navy-900 font-black text-xs flex items-center justify-center shadow-xs">
                  {colActions.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-sm text-slate-900 leading-snug">
                        {action.title}
                      </span>
                      {action.is_overdue === 1 && (
                        <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 animate-pulse">
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{action.locality_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Owner: {action.owner}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {action.deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-teal-800">
                        <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                        <span>Budget: ₹{action.budget.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Proof Section if done/verified */}
                    {action.proof_url && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center gap-1 text-teal-800 font-bold">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photographic Proof Linked</span>
                        </div>
                        <a
                          href={action.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate block"
                        >
                          {action.proof_url}
                        </a>
                        {action.proof_lat && (
                          <div className="text-slate-500">
                            GPS Geotag: {action.proof_lat}, {action.proof_lon}
                          </div>
                        )}
                        {action.second_confirmer && (
                          <div className="text-teal-700 font-semibold pt-1">
                            Second Confirmer: {action.second_confirmer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Transition Controls */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 justify-end">
                      {action.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(action.id, 'in_progress')}
                          className="px-2.5 py-1 rounded-lg bg-navy-900 text-white font-bold text-[11px] hover:bg-navy-800"
                        >
                          Start Work &rarr;
                        </button>
                      )}

                      {action.status === 'in_progress' && (
                        <button
                          onClick={() => setSelectedActionForProof(action)}
                          className="px-2.5 py-1 rounded-lg bg-purple-700 text-white font-bold text-[11px] hover:bg-purple-600 flex items-center gap-1"
                        >
                          <UploadCloud className="w-3 h-3" />
                          <span>Upload Proof &rarr;</span>
                        </button>
                      )}

                      {action.status === 'done' && (
                        <button
                          onClick={() => handleVerifySecondConfirmer(action.id)}
                          className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-bold text-[11px] hover:bg-teal-600 flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>2nd Confirm & Close</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof Upload Modal */}
      {selectedActionForProof && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Submit Geotagged Completion Proof
            </h3>
            <p className="text-xs text-slate-500">
              Proof requires a timestamped photo URL and verified coordinates before verification.
            </p>

            <form onSubmit={handleUploadProof} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evidence Photo URL</label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GPS Latitude</label>
                  <input
                    type="text"
                    value={proofLat}
                    onChange={(e) => setProofLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GPS Longitude</label>
                  <input
                    type="text"
                    value={proofLon}
                    onChange={(e) => setProofLon(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedActionForProof(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-bold hover:bg-navy-800"
                >
                  Submit Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
