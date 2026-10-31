import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

export default function EarlyWarningScreen({ lang }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/alerts/early-warning?sport=badminton');
        setAlerts(res.alerts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-black">
              {lang === 'or' ? 'ଶୀଘ୍ର ସତର୍କତା ବ୍ୟବସ୍ଥା (Early Warning)' : 'Early Warning Detection Engine'}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          Proactive monitoring rule: Flags any block where weekly sports attendance falls &gt; 25% below its 4-week moving average for two consecutive weeks, matching an instant remedy to the primary reported barrier.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">All Blocks Stable</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No consecutive 25% attendance anomalies detected across Sundargarh badminton sessions over the last 14 days.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border-l-4 border-red-500 shadow-sm border-slate-200 space-y-4"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      Critical Anomaly
                    </span>
                    <h3 className="font-bold text-base text-navy-900">{alert.locality_name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{alert.rule_triggered}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-red-600">-{alert.drop_percentage}% Drop</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">vs 4-Week Average ({alert.baseline_average} kids)</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Empirical Root Cause:</span>
                  <div className="capitalize font-semibold text-slate-900">
                    Priority Barrier: {alert.top_barrier_cause.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Recommended Remedial Action:</span>
                  <div className="font-bold text-teal-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-saffron-600 flex-shrink-0" />
                    <span>{alert.suggested_action}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
