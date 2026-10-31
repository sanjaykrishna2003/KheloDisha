import React, { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle, AlertTriangle, EyeOff, Info } from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';
import { t } from '../services/i18n';

export default function PublicScorecardScreen({ lang }) {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);

  const strings = t(lang);

  useEffect(() => {
    const fetchScorecard = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/public/scorecard?district=Sundargarh&sport=badminton');
        setScorecard(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, []);

  if (loading || !scorecard) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 font-semibold">
        Loading public scorecard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title with Viksit Bharat Branding */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-auto bg-white rounded-lg p-1">
              <img
                src="/viksit-bharat-logo.png"
                alt="Viksit Bharat @ 2047"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-black">
                {strings.public.title}
              </h2>
              <div className="text-xs text-saffron-400 font-bold">
                {strings.mission_tagline}
              </div>
            </div>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          {strings.public.subtitle}
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 flex items-start gap-3">
        <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-teal-900 block">{strings.public.privacy_badge}</span>
          <span>{strings.public.privacy_note}</span>
        </div>
      </div>

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scorecard.blocks.map((block) => (
          <div
            key={block.block}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-navy-900">{block.locality_name}</h3>
                <span className="text-xs text-slate-500">{block.district} District • Rural Plains Cluster</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-saffron-600">{block.gap_score}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">{strings.public.opportunity_gap}</div>
              </div>
            </div>

            {/* Participation Metrics with Small Group Suppression Guard */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'युवा भागीदारी:' : (lang === 'or' ? 'ଯୁବ ଅଂଶଗ୍ରହଣ:' : 'Youth Participation:')}
              </div>
              {block.participation?.suppressed ? (
                <div className="flex items-center gap-1.5 text-amber-800 font-medium">
                  <EyeOff className="w-4 h-4 text-amber-600" />
                  <span>
                    {lang === 'hi'
                      ? 'लघु समूह सुरक्षा: १० से कम बच्चों के आँकड़े प्रदर्शित नहीं किए जाते।'
                      : (lang === 'or'
                        ? 'କ୍ଷୁଦ୍ର ଗୋଷ୍ଠୀ ସୁରକ୍ଷା: ୧୦ ରୁ କମ୍ ପିଲାଙ୍କ ତଥ୍ୟ ଲୁକ୍କାୟିତ।'
                        : block.participation.message)}
                  </span>
                </div>
              ) : (
                <div className="text-slate-600 space-y-0.5">
                  <div>{strings.public.active_athletes}: <b>{block.participation.total_active_athletes}</b></div>
                  <div>{strings.public.girls_participation}: <b>{block.participation.girls_percentage}%</b> ({block.participation.girls_count} girls)</div>
                </div>
              )}
            </div>

            {/* Top Barriers */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1.5">
                {lang === 'hi' ? 'पहचानी गई प्रमुख जमीनी बाधाएं:' : (lang === 'or' ? 'ଚିହ୍ନଟ ହୋଇଥିବା ମୁଖ୍ୟ ଅସୁବିଧା:' : 'Top Identified Ground Barriers:')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {block.top_barriers.map(b => (
                  <span key={b.category} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 capitalize">
                    {strings.barriers[b.category] || b.category.replace('_', ' ')} ({b.count} reports)
                  </span>
                ))}
              </div>
            </div>

            {/* Actions Done */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {lang === 'hi' ? 'लागू किए गए समाधान:' : (lang === 'or' ? 'କାର୍ଯ୍ୟକାରୀ ହୋଇଥିବା ପଦକ୍ଷେପ:' : 'Interventions Deployed:')}
              </span>
              <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {block.actions_completed} {strings.public.completed_actions}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
