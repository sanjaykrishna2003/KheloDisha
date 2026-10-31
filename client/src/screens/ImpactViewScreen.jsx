import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Layers,
  Award,
  CheckCircle2,
  Users
} from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

export default function ImpactViewScreen({ lang }) {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocality, setSelectedLocality] = useState('LOC-BLOCK-B');

  const loadImpact = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/impact/evaluation/${selectedLocality}`);
      setImpactData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImpact();
  }, [selectedLocality]);

  if (loading || !impactData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
        Computing Difference-in-Differences impact metrics...
      </div>
    );
  }

  const { treated_locality, comparison_locality, metrics, chart_data, caution_disclaimer } = impactData;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-black">
              {lang === 'or' ? 'ପ୍ରଭାବ ମୂଲ୍ୟାଙ୍କନ (DiD ପଦ୍ଧତି)' : 'Quasi-Experimental Impact Evaluation (DiD)'}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          Comparing treated locality against a scientifically matched peer block from the same rural plains cluster to isolate seasonal trends from real observed intervention gains.
        </p>
      </div>

      {/* Mandatory Caution Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-black text-sm uppercase tracking-wide block">
            Scientific Reporting Principle: "{caution_disclaimer}"
          </span>
          <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
            Policy guidance requires reporting real-world programmatic outcomes as <b>observed change</b> rather than conclusive clinical causation. Environmental, family, and seasonal factors are controlled via peer-group difference-in-differences.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Treated Block Change
          </div>
          <div className="text-2xl font-black text-navy-900 mt-1">
            +{metrics.treated.change} attendees/wk
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {treated_locality.name}: <b>{metrics.treated.baseline_attendance}</b> &rarr; <b>{metrics.treated.post_attendance}</b> (Sample N={metrics.treated.sample_size})
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Matched Control Block
          </div>
          <div className="text-2xl font-black text-slate-700 mt-1">
            +{metrics.comparison.change} attendees/wk
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {comparison_locality.name}: <b>{metrics.comparison.baseline_attendance}</b> &rarr; <b>{metrics.comparison.post_attendance}</b> (Sample N={metrics.comparison.sample_size})
          </div>
        </div>

        <div className="bg-teal-900 text-white p-5 rounded-2xl shadow-sm border border-teal-800">
          <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            Observed Net Program Effect
          </div>
          <div className="text-3xl font-black text-saffron-400 mt-1">
            +{metrics.difference_in_differences.observed_effect} attendees/wk
          </div>
          <div className="text-xs text-teal-200 mt-1">
            DiD Effect = (+{metrics.treated.change}) - (+{metrics.comparison.change}) = <b>+{metrics.difference_in_differences.observed_effect}</b>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart Comparison */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Weekly Attendance: Treated Block vs. Matched Control
            </h3>
            <p className="text-xs text-slate-500">
              Pre-intervention baseline (June 2026) vs. Month 3 post-transport and coach deployment (Sept 2026).
            </p>
          </div>
          <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full">
            Unit: Regular child attendees per week
          </div>
        </div>

        <div className="h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chart_data}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis domain={[0, 80]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val) => [`${val} children`, 'Weekly Attendance']} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="treated" name={`${treated_locality.name} (Treated)`} fill="#0d9488" radius={[6, 6, 0, 0]} />
              <Bar dataKey="comparison" name={`${comparison_locality.name} (Control)`} fill="#94a3b8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <b>Evaluation Interpretation</b>: In Block B (Bargaon), regular badminton attendance expanded by <b>33 children per week</b> after deploying the subsidized shared transport route and female coach chaperone. Across the same timeframe in the matched comparison Block E (Lephripara), natural organic growth was only <b>6 children per week</b>. The net observed difference attributable to programmatic intervention is approximately <b>27 attendees per week</b>.
        </div>
      </div>
    </div>
  );
}
