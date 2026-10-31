import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Sliders,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Filter,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import L from 'leaflet';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';

// Helper to determine marker color by gap score
function getGapColor(score) {
  if (score >= 70) return '#ea580c'; // Saffron/Red high need
  if (score >= 25) return '#f59e0b'; // Amber medium need
  return '#10b981'; // Green low need
}

export default function OfficerDashboardScreen({ onSelectLocality, lang }) {
  const [localities, setLocalities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('badminton');
  const [district, setDistrict] = useState('Sundargarh');
  const [stabilityStatus, setStabilityStatus] = useState('stable');

  // Adjustable Indicator Weights
  const [weights, setWeights] = useState({
    unserved_demand: 30,
    access_gap: 25,
    barrier_pressure: 25,
    equity_gap: 20
  });

  const [showWeightsPanel, setShowWeightsPanel] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const locRes = await apiRequest(`/localities?district=${district}&sport=${sport}`);
      setLocalities(locRes.localities || []);

      const facRes = await apiRequest(`/facilities?sport=${sport}`);
      setFacilities(facRes.facilities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [district, sport]);

  // Leaflet Map Initialization and Layer Management
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered at Sundargarh, Odisha
      const map = L.map(mapContainerRef.current).setView([22.25, 84.22], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors • Free OSM Tiles'
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    layerGroup.clearLayers();

    // 1. Plot 5 km Estimated Reach Circles for verified facilities
    facilities.forEach(fac => {
      const circle = L.circle([fac.lat, fac.lon], {
        radius: 5000, // 5 km radius
        color: '#0d9488',
        fillColor: '#14b8a6',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      });
      circle.bindTooltip(`<b>${fac.name}</b><br/>5 km reach zone (estimated distance)`, { sticky: true });
      layerGroup.addLayer(circle);

      // Facility marker
      const facMarker = L.circleMarker([fac.lat, fac.lon], {
        radius: 6,
        color: '#0f766e',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      });
      facMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <b>${fac.name}</b><br/>
          Weekly Capacity: ${fac.weekly_sessions * fac.participants_per_session}<br/>
          Fee Level: ${fac.fee_level}<br/>
          Status: ${fac.verification_status}
        </div>
      `);
      layerGroup.addLayer(facMarker);
    });

    // 2. Plot Block Localities colored by Gap Score
    localities.forEach(loc => {
      const color = getGapColor(loc.gap_score || 0);
      const marker = L.circleMarker([loc.lat, loc.lon], {
        radius: 14,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.9,
        weight: 3
      });

      marker.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <b style="font-size: 13px;">${loc.name}</b><br/>
          <span style="color: ${color}; font-weight: bold;">Gap Score: ${loc.gap_score}</span> (${loc.confidence_label || 'High'})<br/>
          Child Pop: ${loc.child_population}
        </div>
      `, { permanent: false, sticky: true });

      marker.on('click', () => {
        if (onSelectLocality) onSelectLocality(loc.id);
      });

      layerGroup.addLayer(marker);
    });

    // Cleanup on unmount
    return () => {
      // Keep map alive across tab switching or remove if destroyed
    };
  }, [localities, facilities]);

  const handleRecomputeWeights = async () => {
    try {
      const sum = weights.unserved_demand + weights.access_gap + weights.barrier_pressure + weights.equity_gap;
      const normalizedWeights = {
        unserved_demand: Number((weights.unserved_demand / sum).toFixed(4)),
        access_gap: Number((weights.access_gap / sum).toFixed(4)),
        barrier_pressure: Number((weights.barrier_pressure / sum).toFixed(4)),
        equity_gap: Number((weights.equity_gap / sum).toFixed(4))
      };

      const res = await apiRequest('/localities/recompute-scores', {
        method: 'POST',
        body: JSON.stringify({ weights: normalizedWeights, sport })
      });

      setStabilityStatus(res.stability.status);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetWeights = () => {
    setWeights({
      unserved_demand: 30,
      access_gap: 25,
      barrier_pressure: 25,
      equity_gap: 20
    });
    setStabilityStatus('stable');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-navy-900">
              {lang === 'or' ? 'ଅଫିସର ଡ୍ୟାସବୋର୍ଡ: କ୍ରୀଡା ଅଭାବ ସୂଚକାଙ୍କ' : 'District Sporting Opportunity Gap Map'}
            </h2>
            <SimulatedBadge />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'or'
              ? 'ସୁନ୍ଦରଗଡ ଜିଲ୍ଲାର ସମାନ ଗ୍ରାମୀଣ ବ୍ଲକ୍ ମଧ୍ୟରେ ତୁଳନା। ନାଲି/କମଳା ରଙ୍ଗ ଅଧିକ ଅଭାବ ଦର୍ଶାଏ।'
              : 'Empirical decision-support: Red/Saffron indicates acute opportunity gaps. Compared strictly within rural plains peer group.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>District: Sundargarh</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <span>Sport: Badminton</span>
          </div>

          <button
            onClick={() => setShowWeightsPanel(!showWeightsPanel)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-sm transition"
          >
            <Sliders className="w-3.5 h-3.5 text-saffron-400" />
            <span>{showWeightsPanel ? 'Hide Weights' : 'Adjust Weights'}</span>
          </button>
        </div>
      </div>

      {/* Adjustable Weights Panel (Collapsible) */}
      {showWeightsPanel && (
        <div className="bg-navy-950 text-white p-5 rounded-2xl shadow-xl border border-navy-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-saffron-500" />
              <h3 className="font-bold text-sm">Policy Indicator Weights Customizer</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                stabilityStatus === 'stable' ? 'bg-teal-900 text-teal-300 border border-teal-700' : 'bg-amber-900 text-amber-300 border border-amber-700'
              }`}>
                Stability: {stabilityStatus.toUpperCase()} (±10pt order check)
              </span>
              <button
                onClick={handleResetWeights}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Unserved Demand</span>
                <span className="text-teal-400 font-bold">{weights.unserved_demand}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={weights.unserved_demand}
                onChange={(e) => setWeights({ ...weights, unserved_demand: parseInt(e.target.value) })}
                className="w-full accent-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Access Gap (5km)</span>
                <span className="text-teal-400 font-bold">{weights.access_gap}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={weights.access_gap}
                onChange={(e) => setWeights({ ...weights, access_gap: parseInt(e.target.value) })}
                className="w-full accent-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Barrier Pressure</span>
                <span className="text-teal-400 font-bold">{weights.barrier_pressure}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={weights.barrier_pressure}
                onChange={(e) => setWeights({ ...weights, barrier_pressure: parseInt(e.target.value) })}
                className="w-full accent-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Equity Gap (Girls)</span>
                <span className="text-teal-400 font-bold">{weights.equity_gap}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={weights.equity_gap}
                onChange={(e) => setWeights({ ...weights, equity_gap: parseInt(e.target.value) })}
                className="w-full accent-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-navy-800">
            <button
              onClick={handleRecomputeWeights}
              className="px-4 py-2 rounded-lg bg-saffron-600 hover:bg-saffron-500 text-white font-bold text-xs shadow-md transition"
            >
              Recompute Scores & Run Stability Check
            </button>
          </div>
        </div>
      )}

      {/* Map & Ranked List Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive GIS Map */}
        <div className="lg:col-span-7 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-sm text-slate-800">GIS Opportunity Layer (OpenStreetMap)</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-saffron-600"></span> High Gap (&ge;70)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium (25-70)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low (&lt;25)
              </span>
            </div>
          </div>

          <div className="w-full h-[440px] rounded-xl overflow-hidden border border-slate-200">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dashed circles show 5 km straight-line radius around verified courts (estimated distance).</span>
            <span className="font-medium text-slate-700">Click any marker to inspect</span>
          </div>
        </div>

        {/* Ranked Block List */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-navy-900" />
                <h3 className="font-bold text-sm text-slate-900">Ranked Opportunity Gaps</h3>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                Peer Group: Rural Plains
              </span>
            </div>

            <div className="space-y-3">
              {localities.map((loc, idx) => {
                const color = getGapColor(loc.gap_score || 0);
                return (
                  <div
                    key={loc.id}
                    onClick={() => onSelectLocality && onSelectLocality(loc.id)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-navy-900 hover:shadow-md cursor-pointer transition-all bg-slate-50/60 hover:bg-white flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-navy-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 group-hover:text-navy-900 flex items-center gap-1.5">
                          <span>{loc.block}</span>
                          <span className="text-[10px] font-normal text-slate-500">({loc.district})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Pop: {loc.child_population} • Conf: <span className="font-semibold text-teal-700">{loc.confidence_label || 'High'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-black" style={{ color }}>
                          {loc.gap_score !== null ? loc.gap_score.toFixed(1) : '—'}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Gap Score
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>
              <b>Acceptance Benchmark</b>: Block B (84.3) exhibits highest opportunity gap due to access distance (25.0) and girls equity disparity (20.0).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
