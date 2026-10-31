import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, AlertCircle, CheckCircle2, UserX, Award } from 'lucide-react';
import { apiRequest } from '../services/api';
import SimulatedBadge from '../components/SimulatedBadge';
import { t } from '../services/i18n';

export default function PlayerRegistrationScreen({ lang }) {
  const strings = t(lang);

  const [formData, setFormData] = useState({
    age_band: '10_14',
    gender: 'female',
    school: 'Bargaon Govt High School',
    locality_id: 'LOC-BLOCK-B',
    sport_interest: 'badminton',
    guardian_name: 'Manoj Kumar Oram',
    guardian_contact: '+91 94370 12345',
    purpose: 'Khelo India & Viksit Bharat Youth Sports participation',
    consent_granted: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [myChildren, setMyChildren] = useState([]);

  const fetchChildren = async () => {
    try {
      const res = await apiRequest('/players/my-children');
      setMyChildren(res.players || []);
    } catch (e) {
      // Demo role fallback
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!formData.consent_granted) {
      setError(
        lang === 'hi'
          ? 'अभिभावक सहमति अनिवार्य है: बच्चे के पंजीकरण से पूर्व सहमति चेकबॉक्स पर टिक करना आवश्यक है।'
          : (lang === 'or'
            ? 'ଅଭିଭାବକଙ୍କ ସମ୍ମତି ବିନା ୧୮ ବର୍ଷରୁ କମ୍ ପିଲାଙ୍କ ତଥ୍ୟ ସଞ୍ଚୟ ହୋଇପାରିବ ନାହିଁ।'
            : 'Parental Consent Required: You must check the consent agreement before a child athlete under 18 can be registered.')
      );
      setLoading(false);
      return;
    }

    try {
      const payload = {
        age_band: formData.age_band,
        gender: formData.gender,
        school: formData.school,
        locality_id: formData.locality_id,
        sport_interest: formData.sport_interest,
        consent: {
          guardian_name: formData.guardian_name,
          guardian_contact: formData.guardian_contact,
          purpose: formData.purpose,
          status: 'granted'
        }
      };

      const res = await apiRequest('/players/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setMessage(
        lang === 'hi'
          ? `खिलाड़ी पंजीकरण सफल! आवंटित गुप्त आईडी: ${res.player.pseudo_id} (गोपनीयता सुरक्षित)`
          : (lang === 'or'
            ? `ପିଲାଙ୍କ ପଞ୍ଜୀକରଣ ସଫଳ ହୋଇଛି! ଗୁପ୍ତ ପରିଚୟ ନମ୍ବର: ${res.player.pseudo_id}`
            : `Registration Successful! Assigned Pseudonymous ID: ${res.player.pseudo_id} (Privacy Protected)`)
      );
      fetchChildren();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawConsent = async (pseudoId) => {
    const confirmPrompt = lang === 'hi'
      ? 'क्या आप सचमुच अभिभावक सहमति वापस लेना चाहते हैं? खिलाड़ी का रिकॉर्ड तुरंत निष्क्रिय कर दिया जाएगा।'
      : (lang === 'or'
        ? 'ଆପଣ ନିଶ୍ଚିତ ଭାବରେ ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?'
        : 'Are you sure you want to withdraw parental consent? The child record will be immediately deactivated.');

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      await apiRequest('/players/withdraw-consent', {
        method: 'POST',
        body: JSON.stringify({
          player_pseudo_id: pseudoId,
          reason: 'Guardian revoked consent via app'
        })
      });
      alert(lang === 'hi' ? 'सहमति वापस ले ली गई है और रिकॉर्ड निष्क्रिय हो गया है।' : (lang === 'or' ? 'ସମ୍ମତି ପ୍ରତ୍ୟାହାର ହୋଇଛି ଏବଂ ରେକର୍ଡ ନିଷ୍କ୍ରିୟ ହୋଇଛି।' : 'Consent withdrawn. Record immediately deactivated.'));
      fetchChildren();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title & Privacy Banner */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-lg border border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-black">
              {strings.consent.title}
            </h2>
          </div>
          <SimulatedBadge />
        </div>
        <p className="text-xs text-slate-300">
          {strings.consent.subtitle}
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          {lang === 'hi' ? '१. खिलाड़ी का विवरण' : (lang === 'or' ? '୧. ପିଲାଙ୍କ ବିବରଣୀ' : '1. Athlete Details')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.consent.age_band}
            </label>
            <select
              value={formData.age_band}
              onChange={(e) => setFormData({ ...formData, age_band: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="under_10">Under 10 years (10 वर्ष से कम)</option>
              <option value="10_14">10 to 14 years (10 से 14 वर्ष)</option>
              <option value="15_17">15 to 17 years (15 से 17 वर्ष)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.consent.gender}
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="female">Female (बालिका / ଝିଅ)</option>
              <option value="male">Male (बालक / ପୁଅ)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.consent.block}
            </label>
            <select
              value={formData.locality_id}
              onChange={(e) => setFormData({ ...formData, locality_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="LOC-BLOCK-A">Kutra Block (Block A)</option>
              <option value="LOC-BLOCK-B">Bargaon Block (Block B)</option>
              <option value="LOC-BLOCK-C">Subdega Block (Block C)</option>
              <option value="LOC-BLOCK-D">Balishankara Block (Block D)</option>
              <option value="LOC-BLOCK-E">Lephripara Block (Block E)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.consent.sport}
            </label>
            <select
              value={formData.sport_interest}
              onChange={(e) => setFormData({ ...formData, sport_interest: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="badminton">Badminton (बैडमिंटन)</option>
              <option value="football">Football (फुटबॉल)</option>
              <option value="hockey">Hockey (हॉकी)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {strings.consent.school}
            </label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
              placeholder="e.g. Govt Nodal High School Bargaon"
              required
            />
          </div>
        </div>

        {/* Consent Gate Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-saffron-600" />
            <span>{lang === 'hi' ? '२. अभिभावक सहमति पत्र (अनिवार्य)' : (lang === 'or' ? '୨. ଅଭିଭାବକଙ୍କ ସମ୍ମତି ପତ୍ର (ବାଧ୍ୟତାମୂଳକ)' : '2. Guardian Consent Agreement (Mandatory)')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {strings.consent.guardian_name}
              </label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {strings.consent.guardian_contact}
              </label>
              <input
                type="text"
                value={formData.guardian_contact}
                onChange={(e) => setFormData({ ...formData, guardian_contact: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consentCheck"
                checked={formData.consent_granted}
                onChange={(e) => setFormData({ ...formData, consent_granted: e.target.checked })}
                className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="consentCheck" className="text-slate-800 font-semibold leading-relaxed cursor-pointer">
                {strings.consent.agreement}
              </label>
            </div>
            <p className="text-[11px] text-slate-500 pl-6">
              {strings.consent.privacy_promise}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.consent_granted}
          className="w-full py-3.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <UserCheck className="w-5 h-5 text-teal-400" />
          <span>{loading ? 'Processing...' : strings.consent.submit}</span>
        </button>
      </form>

      {/* Already Registered Children (Parent's View) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" />
          <span>{strings.consent.my_children}</span>
        </h3>

        {myChildren.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No registered children under this account.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {myChildren.map((child) => (
              <div key={child.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-navy-900">{child.pseudo_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      child.is_active ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {child.is_active ? strings.consent.active : strings.consent.consent_revoked}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {child.gender} • {child.age_band.replace('_', ' ')} • {child.sport_interest} • {child.locality_name || child.locality_id}
                  </div>
                </div>

                {child.is_active === 1 && (
                  <button
                    onClick={() => handleWithdrawConsent(child.pseudo_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{strings.consent.withdraw_consent}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
