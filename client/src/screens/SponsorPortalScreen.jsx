import React, { useState, useEffect } from 'react';
import { DollarSign, Award, CheckCircle, Heart, Building, Info } from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

export default function SponsorPortalScreen({ lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pledgeSuccess, setPledgeSuccess] = useState(null);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/sponsors/matchmaking?sport=badminton');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handlePledge = async (match) => {
    try {
      await apiRequest('/sponsors/fund', {
        method: 'POST',
        body: JSON.stringify({
          locality_id: match.locality_id,
          amount: 50000,
          sponsor_id: data.sponsor.id
        })
      });

      setPledgeSuccess(`CSR Funding pledge of ₹50,000 registered for ${match.locality_name}! Assigned to local equipment and coaching subsidy.`);
      setTimeout(() => setPledgeSuccess(null), 5000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
        Computing CSR match scores...
      </div>
    );
  }

  const { sponsor, matches, district_pool } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-saffron-500" />
            <h2 className="text-xl font-black">
              {lang === 'or' ? 'କର୍ପୋରେଟ୍ CSR କ୍ରୀଡା ସହଯୋଗିତା' : 'CSR Sponsor Matchmaking Portal'}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          Matchmaking algorithm: 50% CSR thematic fit (geography & sport priority) + 50% ground need (gap score &times; unfunded share). Sponsors view aggregated community impact only.
        </p>
      </div>

      {pledgeSuccess && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span>{pledgeSuccess}</span>
        </div>
      )}

      {/* Sponsor Profile & District Pool Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <Building className="w-4 h-4 text-teal-600" />
            <span>Active Partner CSR Profile</span>
          </div>
          <div className="text-xl font-black text-navy-900">{sponsor.name}</div>
          <div className="text-xs text-slate-600">
            Total CSR Budget: <b>₹{(sponsor.total_budget / 100000).toFixed(1)} Lakhs</b> • Committed: <b>₹{(sponsor.committed_budget / 100000).toFixed(1)} Lakhs</b>
          </div>
        </div>

        <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white p-5 rounded-2xl border border-navy-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-saffron-400 uppercase">
            <Heart className="w-4 h-4 text-saffron-400" />
            <span>District Sports Infrastructure Pool</span>
          </div>
          <div className="text-xl font-black text-white">{district_pool.name}</div>
          <div className="text-xs text-slate-300">
            Unallocated Emergency Reserve: <b>₹{(district_pool.unallocated_amount / 100000).toFixed(1)} Lakhs</b> for unmatched rural clusters.
          </div>
        </div>
      </div>

      {/* Recommended Matched Localities */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-base text-slate-900">
          Ranked Locality Matches by Fit & Need
        </h3>

        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.locality_id}
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-900 transition bg-slate-50/60 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">{m.locality_name}</h4>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-900">
                    {m.match_score}% Match
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {m.fit_reason} • Gap Score: <b className="text-saffron-700">{m.gap_score}</b>
                </p>
                <div className="text-[11px] text-slate-500 mt-1">
                  Fit Score: {m.fit_score}% • Need Score: {m.need_score}% • Unfunded Gap: ₹{(m.unfunded_amount / 1000).toFixed(0)}k
                </div>
              </div>

              <button
                onClick={() => handlePledge(m)}
                className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4 text-saffron-400" />
                <span>Pledge ₹50,000 Support</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
