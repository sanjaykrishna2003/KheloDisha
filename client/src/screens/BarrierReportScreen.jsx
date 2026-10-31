import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  WifiOff,
  CheckCircle2,
  MapPin,
  Clock,
  Coins,
  Shield,
  Layers,
  Users,
  Eye,
  BookOpen
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { savePendingReport } from '../services/offlineQueue';
import SimulatedBadge from '../components/SimulatedBadge';
import { t } from '../services/i18n';

const CATEGORY_META = [
  { id: 'no_ground', icon: MapPin, color: 'hover:border-red-500 bg-red-50 text-red-900' },
  { id: 'no_coach', icon: Users, color: 'hover:border-blue-500 bg-blue-50 text-blue-900' },
  { id: 'cost', icon: Coins, color: 'hover:border-amber-500 bg-amber-50 text-amber-900' },
  { id: 'distance', icon: Clock, color: 'hover:border-indigo-500 bg-indigo-50 text-indigo-900' },
  { id: 'safety', icon: Shield, color: 'hover:border-purple-500 bg-purple-50 text-purple-900' },
  { id: 'equipment', icon: Layers, color: 'hover:border-teal-500 bg-teal-50 text-teal-900' },
  { id: 'overcrowding', icon: Users, color: 'hover:border-orange-500 bg-orange-50 text-orange-900' },
  { id: 'awareness', icon: Eye, color: 'hover:border-cyan-500 bg-cyan-50 text-cyan-900' },
  { id: 'exams', icon: BookOpen, color: 'hover:border-emerald-500 bg-emerald-50 text-emerald-900' }
];

export default function BarrierReportScreen({ lang, isOnline }) {
  const [selectedCategory, setSelectedCategory] = useState('no_ground');
  const [localityId, setLocalityId] = useState('LOC-BLOCK-B');
  const [sport, setSport] = useState('badminton');
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const strings = t(lang);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    const reportData = {
      locality_id: localityId,
      sport,
      category: selectedCategory,
      notes,
      date: new Date().toISOString().split('T')[0]
    };

    if (!isOnline) {
      // Save offline in phone queue
      savePendingReport(reportData);
      setStatusMessage({
        type: 'offline',
        text: strings.report.offline_saved
      });
      setNotes('');
      setSubmitting(false);
      return;
    }

    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
      setStatusMessage({
        type: 'success',
        text: lang === 'hi'
          ? 'समस्या रिपोर्ट सफलतापूर्वक जमा हुई! यह ब्लॉक गैप स्कोर में विश्वास-भारित होकर शामिल हो गई है।'
          : (lang === 'or'
            ? 'ଅସୁବିଧା ରିପୋର୍ଟ ସଫଳତାର ସହ ଦାଖଲ ହୋଇଛି! ଏହା ବ୍ଲକ୍ ଗ୍ୟାପ୍ ସ୍କୋର ଗଣନାରେ ଅନ୍ତର୍ଭୁକ୍ତ ହେଲା।'
            : 'Ground report submitted successfully! Trust-weighted into block gap diagnostics.')
      });
      setNotes('');
    } catch (err) {
      // Fallback to offline queue
      savePendingReport(reportData);
      setStatusMessage({
        type: 'offline',
        text: strings.report.offline_saved
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-saffron-500" />
            <h2 className="text-xl font-black">
              {strings.report.title}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          {strings.report.subtitle}
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          statusMessage.type === 'offline' ? 'bg-amber-50 border border-amber-300 text-amber-900' : 'bg-teal-50 border border-teal-300 text-teal-900'
        }`}>
          {statusMessage.type === 'offline' ? (
            <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.report.select_block}
            </label>
            <select
              value={localityId}
              onChange={(e) => setLocalityId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-teal-500"
            >
              <option value="LOC-BLOCK-B">Bargaon Block (Block B) • Priority Gap Block</option>
              <option value="LOC-BLOCK-A">Kutra Block (Block A)</option>
              <option value="LOC-BLOCK-D">Balishankara Block (Block D)</option>
              <option value="LOC-BLOCK-C">Subdega Block (Block C)</option>
              <option value="LOC-BLOCK-E">Lephripara Block (Block E)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.report.select_sport}
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-teal-500"
            >
              <option value="badminton">Badminton (बैडमिंटन / ବ୍ୟାଡମିଣ୍ଟନ)</option>
              <option value="football">Football (फुटबॉल / ଫୁଟବଲ୍)</option>
              <option value="hockey">Hockey (हॉकी / ହକି)</option>
            </select>
          </div>
        </div>

        {/* Large Touch Target Fixed Categories with Dynamic Localization */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            {strings.report.select_barrier}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CATEGORY_META.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const translatedLabel = strings.barriers[cat.id] || cat.id;

              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all min-h-[85px] ${
                    isSelected
                      ? 'border-navy-900 bg-navy-50 shadow-md ring-2 ring-saffron-500'
                      : `border-slate-200 ${cat.color}`
                  }`}
                >
                  <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isSelected ? 'text-saffron-600' : 'text-slate-600'}`} />
                  <div>
                    <div className="font-bold text-sm text-slate-900 leading-tight">
                      {translatedLabel}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 capitalize font-medium">
                      {cat.id.replace('_', ' ')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {strings.report.notes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
            placeholder={lang === 'hi' ? 'उदा. कोर्ट का नेट टूटा हुआ है, शाम 6 बजे के बाद लाइट नहीं है, दूरी 7 किमी है...' : 'e.g. Broken badminton court net, lights do not work after 6pm, distance from village is 7 km without bus...'}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-4 rounded-xl bg-saffron-600 hover:bg-saffron-500 text-white font-black text-base shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
        >
          <Send className="w-5 h-5 text-white" />
          <span>
            {submitting ? '...' : (isOnline ? strings.report.submit_online : strings.report.submit_offline)}
          </span>
        </button>
      </form>
    </div>
  );
}
