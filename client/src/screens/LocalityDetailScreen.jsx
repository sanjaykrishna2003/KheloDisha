import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  Zap,
  DollarSign,
  Users,
  ShieldCheck,
  TrendingDown,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

export default function LocalityDetailScreen({ localityId, onBack, lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/localities/${localityId}?sport=badminton`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localityId) loadDetail();
  }, [localityId]);

  const handleApprove = async (rec) => {
    try {
      await apiRequest('/actions/approve-recommendation', {
        method: 'POST',
        body: JSON.stringify({
          recommendation_id: rec.id,
          owner: 'Shri Rakesh Nayak (Block Development Officer Bargaon)',
          budget: rec.cost,
          deadline: '2026-11-30',
          custom_title: `${rec.intervention_name} - ${data.locality.block}`
        })
      });

      setActionSuccess(`Recommendation approved! Created official tracked action for ${rec.intervention_name}.`);
      loadDetail();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
        Loading locality diagnosis...
      </div>
    );
  }

  const { locality, gap_score, barrier_summary, recommendations } = data;

  // Chart data from contributions
  const contributions = gap_score?.contributions || {
    unserved_demand: 0,
    access_gap: 0,
    barrier_pressure: 0,
    equity_gap: 0
  };

  const chartData = [
    { name: 'Unserved Demand', value: contributions.unserved_demand, color: '#3b82f6' },
    { name: 'Access Gap (5km)', value: contributions.access_gap, color: '#ea580c' },
    { name: 'Barrier Pressure', value: contributions.barrier_pressure, color: '#8b5cf6' },
    { name: 'Equity Gap (Girls)', value: contributions.equity_gap, color: '#14b8a6' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map</span>
        </button>
        <SimulatedBadge />
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black">{locality.name}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
              {locality.district} District
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Terrain: <span className="capitalize">{locality.terrain}</span> • Density: <span className="capitalize">{locality.density_class}</span> • Child Population: <b>{locality.child_population}</b>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-navy-950/80 p-4 rounded-xl border border-navy-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Composite Gap Score</div>
            <div className="text-3xl font-black text-saffron-500">
              {gap_score ? gap_score.score.toFixed(1) : '—'}
            </div>
          </div>
          <div className="border-l border-navy-800 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Data Confidence</div>
            <div className="text-sm font-bold text-teal-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{gap_score?.confidence_label || 'High'} ({Math.round((gap_score?.confidence || 0.9) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Contributions & Top Barriers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contributions Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-base text-slate-900 mb-1">Weighted Indicator Contributions</h3>
          <p className="text-xs text-slate-500 mb-4">
            Shows how each calibrated policy dimension contributes to the total gap score of {gap_score?.score}.
          </p>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 35]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip formatter={(val) => [`${val} points`, 'Contribution']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="text-slate-500 text-[10px] font-bold">Demand</div>
              <div className="text-base font-black text-blue-800">{contributions.unserved_demand}</div>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <div className="text-slate-500 text-[10px] font-bold">Access (5km)</div>
              <div className="text-base font-black text-orange-800">{contributions.access_gap}</div>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <div className="text-slate-500 text-[10px] font-bold">Barriers</div>
              <div className="text-base font-black text-purple-800">{contributions.barrier_pressure}</div>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg">
              <div className="text-slate-500 text-[10px] font-bold">Equity</div>
              <div className="text-base font-black text-teal-800">{contributions.equity_gap}</div>
            </div>
          </div>
        </div>

        {/* Top Empirical Ground Barriers */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Top Empirical Ground Barriers</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ground truth reports verified by students and coaches in this block.
            </p>

            <div className="space-y-3">
              {barrier_summary.map((b, idx) => (
                <div key={b.category} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-900 capitalize">
                        {b.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 ml-7">
                      Average Trust: <span className="font-semibold text-teal-700">{b.avg_trust.toFixed(2)}</span> • {b.confirmed_count} teacher confirmed
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-navy-900">{b.report_count}</span>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Reports</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900">
            System matches interventions directly against the top 2 empirical barriers above.
          </div>
        </div>
      </div>

      {/* Recommended Fixes with Reasons & Officer Action */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-saffron-600" />
              <span>Evidence-Based Recommended Interventions</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by children reached per rupee. The system advises; officers decide.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Assumed Costs (subject to local tender)
          </span>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">No active interventions recommended (Gap score below threshold 50.0).</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-5 rounded-2xl border-2 border-slate-200 hover:border-navy-900 transition bg-slate-50/50 hover:bg-white flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-base text-slate-900">{rec.intervention_name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
                      {rec.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rec.reason}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Expected Reach</div>
                      <div className="text-sm font-black text-navy-900">{rec.expected_reach} kids</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Assumed Budget</div>
                      <div className="text-sm font-black text-slate-900">₹{(rec.cost / 1000).toFixed(0)}k</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Cost / Child</div>
                      <div className="text-sm font-black text-teal-700">₹{rec.cost_per_child}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    Preconditions: <span className="font-semibold text-slate-700">{rec.preconditions}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">Deployment: {rec.time_to_start}</span>
                  {rec.status === 'recommended' && (
                    <button
                      onClick={() => handleApprove(rec)}
                      className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                      <span>Approve & Create Action Plan</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
