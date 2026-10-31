/**
 * KheloDisha Multi-Language Localization Engine (i18n)
 * Supports English (en), Hindi (hi), and Odia (or)
 */

export const TRANSLATIONS = {
  en: {
    app_name: 'KheloDisha',
    sub_title: 'Sports Opportunity Decision-Support Platform',
    mission_tagline: 'Viksit Bharat @ 2047 • Khelo India Mission',
    mission_description: 'Building a developed sporting nation by identifying youth opportunity gaps, funding grassroot fixes, and validating observed impact.',
    district_pilot: 'Sundargarh District Pilot • Odisha',
    online: 'Online',
    offline: 'Offline Mode',
    pending_sync: 'Pending Sync',
    simulated_data: 'Simulated data',
    switch_persona: 'Switch Demo Persona',

    // Navigation
    nav: {
      dashboard: 'Map & Scores',
      actions: 'Action Tracker',
      impact: 'Impact (DiD)',
      report: 'Report Barrier',
      player: 'Child & Consent',
      teacher: 'Teacher Portal',
      public: 'Public Scorecard',
      sponsor: 'Sponsor Match',
      alerts: 'Early Warning',
      audit: 'Audit Logs'
    },

    // Barriers
    barriers: {
      no_ground: 'No Ground / Court',
      no_coach: 'No Coach Available',
      cost: 'High Cost / Fees',
      distance: 'Too Far Away (>5km)',
      safety: 'Safety / No Lighting',
      equipment: 'No Equipment / Rackets',
      overcrowding: 'Overcrowded Court',
      awareness: 'Lack of Awareness',
      exams: 'Academic Exams / Study'
    },

    // Consent & Athlete Form
    consent: {
      title: 'Parental Consent & Child Athlete Registration',
      subtitle: 'Mandatory Consent Gate: Under Khelo India & Viksit Bharat @ 2047 privacy principles, no child under 18 can be saved without verified guardian consent. All analytics use persistent pseudonymous IDs (PLY-XXXXX). Real names are never exposed.',
      age_band: 'Age Band',
      gender: 'Gender',
      block: 'Block / Locality',
      sport: 'Sport Interest',
      school: 'School Name',
      guardian_name: 'Guardian Full Name',
      guardian_contact: 'Guardian Contact Phone',
      agreement: 'I formally grant parental consent for my ward to participate in regular sports coaching drills, attendance tracking, and physical development under the Khelo India and Viksit Bharat @ 2047 missions. I acknowledge that I can revoke this consent at any time without penalty.',
      privacy_promise: 'Privacy Promise: No adult-child direct messaging is permitted. Real names are strictly isolated from officers and sponsors.',
      submit: 'Submit Registration with Verified Consent',
      my_children: 'My Registered Children (Pseudonymous Records)',
      withdraw_consent: 'Withdraw Consent',
      consent_revoked: 'Consent Revoked',
      active: 'Active'
    },

    // Report Barrier Form
    report: {
      title: 'Ground-Level Barrier Report',
      subtitle: 'Works completely offline. High-contrast large touch targets. Teacher-confirmed reports receive 0.8 trust weight, directly feeding into block gap diagnostics.',
      select_block: 'Select Block',
      select_sport: 'Select Sport',
      select_barrier: 'Select Primary Barrier Category (Touch to select)',
      notes: 'Additional Notes / Ground Description (Optional)',
      submit_online: 'Submit Barrier Report',
      submit_offline: 'Save Offline in Phone Queue',
      offline_saved: 'Saved Offline: Network unavailable. Report saved locally and queued for automatic sync when connected.'
    },

    // Public Scorecard
    public: {
      title: 'Public Block Sports Opportunity Scorecard',
      subtitle: 'Transparent public reporting on youth sports access across Sundargarh blocks. Published under the Viksit Bharat @ 2047 athletic empowerment initiative.',
      privacy_badge: 'Strict Child Privacy & Small Group Protection',
      privacy_note: 'Strictly aggregated statistics. Zero personally identifiable information is stored or exposed. Groups under 10 children are automatically suppressed.',
      opportunity_gap: 'Opportunity Gap',
      active_athletes: 'Active Athletes',
      girls_participation: 'Girls Participation',
      completed_actions: 'Ground Action Completed'
    }
  },

  hi: {
    app_name: 'खेलो दिशा',
    sub_title: 'खेल अवसर निर्णय सहायता मंच',
    mission_tagline: 'विकसित भारत @2047 • खेलो इंडिया मिशन',
    mission_description: 'युवाओं में खेल अवसरों के अभाव को दूर कर, जमीनी समाधान लागू कर एवं प्रभाव की पुष्टि कर विकसित खेल राष्ट्र का निर्माण।',
    district_pilot: 'सुंदरगढ़ जिला पायलट • ओडिशा',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन मोड',
    pending_sync: 'सिंक लंबित',
    simulated_data: 'सिम्युलेटेड डेटा',
    switch_persona: 'डेमो रोल बदलें',

    // Navigation
    nav: {
      dashboard: 'नक्शा और स्कोर',
      actions: 'कार्रवाई ट्रैकर',
      impact: 'प्रभाव (DiD)',
      report: 'समस्या रिपोर्ट',
      player: 'खिलाड़ी व सहमति',
      teacher: 'शिक्षक पोर्टल',
      public: 'सार्वजनिक स्कोरकार्ड',
      sponsor: 'सीएसआर प्रायोजक',
      alerts: 'पूर्व चेतावनी',
      audit: 'ऑडिट लॉग'
    },

    // Barriers
    barriers: {
      no_ground: 'मैदान / कोर्ट नहीं है',
      no_coach: 'कोच उपलब्ध नहीं है',
      cost: 'अत्यधिक शुल्क / खर्च',
      distance: 'अत्यधिक दूरी (>5 किमी)',
      safety: 'सुरक्षा / प्रकाश व्यवस्था की कमी',
      equipment: 'खेल उपकरण / रैकेट नहीं',
      overcrowding: 'कोर्ट में अत्यधिक भीड़',
      awareness: 'जागरूकता का अभाव',
      exams: 'परीक्षा का दबाव / पढ़ाई'
    },

    // Consent & Athlete Form
    consent: {
      title: 'अभिभावक सहमति और बाल खिलाड़ी पंजीकरण',
      subtitle: 'अनिवार्य सहमति द्वार: खेलो इंडिया और विकसित भारत @2047 मिशन के तहत, 18 वर्ष से कम आयु के किसी भी बच्चे का डेटा अभिभावक की सहमति के बिना सहेजा नहीं जा सकता। सभी विश्लेषणों में गुप्त आईडी (PLY-XXXXX) का उपयोग होता है। वास्तविक नाम कभी उजागर नहीं होते।',
      age_band: 'आयु वर्ग',
      gender: 'लिंग',
      block: 'ब्लॉक / क्षेत्र',
      sport: 'रुचि का खेल',
      school: 'विद्यालय का नाम',
      guardian_name: 'अभिभावक का पूरा नाम',
      guardian_contact: 'अभिभावक का फोन नंबर',
      agreement: 'मैं स्वेच्छा से अपने बच्चे को खेलो इंडिया और विकसित भारत @2047 मिशन के तहत नियमित खेल प्रशिक्षण, कोचिंग और उपस्थिति ट्रैकिंग में भाग लेने की सहमति देता/देती हूँ। मुझे ज्ञात है कि मैं किसी भी समय बिना किसी जुर्माने के यह सहमति वापस ले सकता/सकती हूँ।',
      privacy_promise: 'गोपनीयता प्रतिज्ञा: वयस्कों और बच्चों के बीच किसी भी प्रकार के सीधे मैसेजिंग की अनुमति नहीं है। वास्तविक नाम अधिकारियों या प्रायोजकों को कभी नहीं दिखाए जाते।',
      submit: 'सत्यापित सहमति के साथ पंजीकरण जमा करें',
      my_children: 'मेरे पंजीकृत बच्चे (गोपनीय रिकॉर्ड)',
      withdraw_consent: 'सहमति वापस लें',
      consent_revoked: 'सहमति वापस ली गई',
      active: 'सक्रिय'
    },

    // Report Barrier Form
    report: {
      title: 'जमीनी स्तर पर खेल समस्या की रिपोर्ट',
      subtitle: 'बिना इंटरनेट (ऑफलाइन) भी कार्य करता है। बड़े टच बटन। शिक्षक द्वारा पुष्टि की गई रिपोर्ट को 0.8 विश्वास भार मिलता है, जो सीधे ब्लॉक गैप स्कोर में जुड़ता है।',
      select_block: 'ब्लॉक चुनें',
      select_sport: 'खेल चुनें',
      select_barrier: 'मुख्य समस्या का चयन करें (स्पर्श करके चुनें)',
      notes: 'अतिरिक्त विवरण / मैदान की स्थिति (वैकल्पिक)',
      submit_online: 'समस्या रिपोर्ट जमा करें',
      submit_offline: 'फोन मेमोरी में ऑफलाइन सहेजें',
      offline_saved: 'ऑफलाइन सहेजा गया: नेटवर्क उपलब्ध नहीं है। रिपोर्ट डिवाइस में सुरक्षित है और इंटरनेट जुड़ते ही स्वतः सिंक हो जाएगी।'
    },

    // Public Scorecard
    public: {
      title: 'सार्वजनिक ब्लॉक खेल अवसर स्कोरकार्ड',
      subtitle: 'सुंदरगढ़ के सभी ब्लॉकों में युवाओं की खेल सुविधाओं पर पारदर्शी रिपोर्ट। विकसित भारत @2047 खेल सशक्तिकरण पहल के तहत प्रकाशित।',
      privacy_badge: 'सख्त बाल गोपनीयता और लघु-समूह सुरक्षा',
      privacy_note: 'कड़ाई से समेकित आँकड़े। कोई भी व्यक्तिगत पहचान योग्य जानकारी नहीं रखी जाती। 10 से कम बच्चों के समूहों के आँकड़े स्वतः छिपा दिए जाते हैं।',
      opportunity_gap: 'अवसर अभाव स्कोर',
      active_athletes: 'सक्रिय खिलाड़ी',
      girls_participation: 'बालिकाओं की भागीदारी',
      completed_actions: 'पूरा किया गया जमीनी कार्य'
    }
  },

  or: {
    app_name: 'ଖେଳୋଦିଶା',
    sub_title: 'କ୍ରୀଡା ସୁବିଧା ଅଭାବ ଚିହ୍ନଟ ଓ ନିଷ୍ପତ୍ତି ପ୍ଲାଟଫର୍ମ',
    mission_tagline: 'ବିକଶିତ ଭାରତ @୨୦୪୭ • ଖେଳୋ ଇଣ୍ଡିଆ ମିଶନ',
    mission_description: 'ପିଲାଙ୍କ କ୍ରୀଡା ସୁବିଧା ଅଭାବ ଦୂର କରି, ଭିତ୍ତିଭୂମି ଯୋଗାଇ ଏବଂ ପ୍ରଭାବ ପ୍ରମାଣିତ କରି ଏକ ବିକଶିତ କ୍ରୀଡା ରାଷ୍ଟ୍ର ଗଠନ।',
    district_pilot: 'ସୁନ୍ଦରଗଡ ଜିଲ୍ଲା ପାଇଲଟ • ଓଡ଼ିଶା',
    online: 'ଅନଲାଇନ୍',
    offline: 'ଅଫଲାଇନ୍ ମୋଡ୍',
    pending_sync: 'ସିଙ୍କ୍ ବାକି ଅଛି',
    simulated_data: 'ସିମ୍ୟୁଲେଟେଡ୍ ତଥ୍ୟ',
    switch_persona: 'ଡେମୋ ରୋଲ୍ ବଦଳାନ୍ତୁ',

    // Navigation
    nav: {
      dashboard: 'ମାନଚିତ୍ର ଓ ସ୍କୋର',
      actions: 'କାର୍ଯ୍ୟାନୁଷ୍ଠାନ ଟ୍ରାକର',
      impact: 'ପ୍ରଭାବ (DiD)',
      report: 'ଅସୁବିଧା ରିପୋର୍ଟ',
      player: 'ପିଲା ଓ ସମ୍ମତି',
      teacher: 'ଶିକ୍ଷକ ପୋର୍ଟାଲ',
      public: 'ସାର୍ବଜନୀନ ସ୍କୋରକାର୍ଡ',
      sponsor: 'ସହଯୋଗୀ ପ୍ରାୟୋଜକ',
      alerts: 'ପୂର୍ବ ସତର୍କତା',
      audit: 'ଅଡିଟ୍ ଲଗ୍'
    },

    // Barriers
    barriers: {
      no_ground: 'ପଡିଆ / କୋର୍ଟ ନାହିଁ',
      no_coach: 'କୋଚ୍ ଉପଲବ୍ଧ ନାହାଁନ୍ତି',
      cost: 'ଅତ୍ୟଧିକ ଖର୍ଚ୍ଚ / ଫିସ୍',
      distance: 'ଅତ୍ୟଧିକ ଦୂରତା (>୫ କି.ମି.)',
      safety: 'ସୁରକ୍ଷା / ଆଲୋକର ଅଭାବ',
      equipment: 'ଖେଳ ଉପକରଣ / ର଼୍ୟାକେଟ ନାହିଁ',
      overcrowding: 'କୋର୍ଟରେ ଅତ୍ୟଧିକ ଭିଡ଼',
      awareness: 'ସଚେତନତାର ଅଭାବ',
      exams: 'ପରୀକ୍ଷା ଚାପ / ପାଠପଢ଼ା'
    },

    // Consent & Athlete Form
    consent: {
      title: 'ଅଭିଭାବକ ସମ୍ମତି ଓ ପିଲା ପଞ୍ଜୀକରଣ',
      subtitle: 'ବାଧ୍ୟତାମୂଳକ ସମ୍ମତି ଦ୍ୱାର: ଖେଳୋ ଇଣ୍ଡିଆ ଏବଂ ବିକଶିତ ଭାରତ @୨୦୪୭ ମିଶନ ନିୟମାନୁଯାୟୀ, ୧୮ ବର୍ଷରୁ କମ୍ ବୟସର ପିଲାମାନଙ୍କ ପାଇଁ ଅଭିଭାବକଙ୍କ ସମ୍ମତି ବିନା ତଥ୍ୟ ସଞ୍ଚୟ ହୋଇପାରିବ ନାହିଁ। କେବଳ ଗୋପନୀୟ ପରିଚୟ (PLY-XXXXX) ବ୍ୟବହୃତ ହୁଏ। ପ୍ରକୃତ ନାମ କଦାପି ପ୍ରକାଶ ପାଏ ନାହିଁ।',
      age_band: 'ବୟସ ବର୍ଗ',
      gender: 'ଲିଙ୍ଗ',
      block: 'ବ୍ଲକ୍ / ଅଞ୍ଚଳ',
      sport: 'ଆଗ୍ରହୀ ଖେଳ',
      school: 'ବିଦ୍ୟାଳୟର ନାମ',
      guardian_name: 'ଅଭିଭାବକଙ୍କ ପୂରା ନାମ',
      guardian_contact: 'ଅଭିଭାବକଙ୍କ ଫୋନ୍ ନମ୍ବର',
      agreement: 'ମୁଁ ସ୍ୱେଚ୍ଛାରେ ମୋ ପିଲାଙ୍କୁ ଖେଳୋ ଇଣ୍ଡିଆ ଓ ବିକଶିତ ଭାରତ @୨୦୪୭ କ୍ରୀଡା ତାଲିମ ଏବଂ ନିୟମିତ ଅଭ୍ୟାସରେ ଅଂଶଗ୍ରହଣ କରିବାକୁ ଅନୁମତି ଦେଉଛି। ମୁଁ ଜାଣିଛି ଯେ ମୁଁ ଯେକୌଣସି ସମୟରେ ବିନା କୌଣସି ଜୋରିମାନାରେ ଏହି ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରିପାରିବି।',
      privacy_promise: 'ଗୋପନୀୟତା ପ୍ରତିଶ୍ରୁତି: ବୟସ୍କ ଓ ପିଲାଙ୍କ ମଧ୍ୟରେ କୌଣସି ସିଧାସଳଖ ମେସେଜିଂର ଅନୁମତି ନାହିଁ। ପ୍ରକୃତ ନାମ ଅଫିସର କିମ୍ବା ସ୍ପନସରମାନଙ୍କୁ କେବେ ଦେଖାଯାଏ ନାହିଁ।',
      submit: 'ସମ୍ମତି ସହ ପଞ୍ଜୀକରଣ ଦାଖଲ କରନ୍ତୁ',
      my_children: 'ମୋର ପଞ୍ଜୀକୃତ ପିଲାମାନେ (ଗୋପନୀୟ ରେକର୍ଡ)',
      withdraw_consent: 'ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରନ୍ତୁ',
      consent_revoked: 'ସମ୍ମତି ପ୍ରତ୍ୟାହୃତ',
      active: 'ସକ୍ରିୟ'
    },

    // Report Barrier Form
    report: {
      title: 'ପଡିଆ ଅସୁବିଧା ରିପୋର୍ଟ (ସିଧାସଳଖ ଜମା)',
      subtitle: 'ଇଣ୍ଟରନେଟ୍ ନଥିଲେ ବି କାମ କରେ। ବଡ଼ ଟଚ୍ ବଟନ୍। ଶିକ୍ଷକଙ୍କ ଦ୍ୱାରା ନିଶ୍ଚିତ ରିପୋର୍ଟକୁ ୦.୮ ବିଶ୍ୱାସ ଭାର ମିଳେ ଏବଂ ଏହା ସିଧାସଳଖ ବ୍ଲକ୍ ଗ୍ୟାପ୍ ସ୍କୋର ଗଣନାରେ ଯୋଡ଼ିହୁଏ।',
      select_block: 'ବ୍ଲକ୍ ଚୟନ କରନ୍ତୁ',
      select_sport: 'ଖେଳ ଚୟନ କରନ୍ତୁ',
      select_barrier: 'ମୁଖ୍ୟ ଅସୁବିଧା ବାଛନ୍ତୁ (ଗୋଟିଏ ଛୁଅଁରେ)',
      notes: 'ଅତିରିକ୍ତ ବିବରଣୀ / ପଡିଆର ସ୍ଥିତି (ଇଚ୍ଛାଧୀନ)',
      submit_online: 'ଅସୁବିଧା ରିପୋର୍ଟ ଦାଖଲ କରନ୍ତୁ',
      submit_offline: 'ଫୋନରେ ଅଫଲାଇନ୍ ସେଭ୍ କରନ୍ତୁ',
      offline_saved: 'ଅଫଲାଇନ୍ ସେଭ୍ ହେଲା: ନେଟୱର୍କ ନାହିଁ। ରିପୋର୍ଟ ଡିଭାଇସରେ ସୁରକ୍ଷିତ ଅଛି ଏବଂ ଇଣ୍ଟରନେଟ୍ ଆସିଲେ ସ୍ୱୟଂଚାଳିତ ଭାବେ ସିଙ୍କ୍ ହେବ।'
    },

    // Public Scorecard
    public: {
      title: 'ସାର୍ବଜନୀନ ବ୍ଲକ୍ ସ୍କୋରକାର୍ଡ',
      subtitle: 'ସୁନ୍ଦରଗଡ଼ ଜିଲ୍ଲାର ସମସ୍ତ ବ୍ଲକରେ ଯୁବ କ୍ରୀଡା ସୁବିଧା ଉପରେ ସ୍ୱଚ୍ଛ ରିପୋର୍ଟ। ବିକଶିତ ଭାରତ @୨୦୪୭ ଅଭିଯାନ ଅଧୀନରେ ପ୍ରକାଶିତ।',
      privacy_badge: 'ଶିଶୁ ଗୋପନୀୟତା ଓ କ୍ଷୁଦ୍ର ଗୋଷ୍ଠୀ ସୁରକ୍ଷା',
      privacy_note: 'କେବଳ ସମଷ୍ଟିଗତ ପରିସଂଖ୍ୟାନ। କୌଣସି ବ୍ୟକ୍ତିଗତ ପରିଚୟ ସଂଗ୍ରହ କିମ୍ବା ପ୍ରକାଶ କରାଯାଏ ନାହିଁ। ୧୦ ରୁ କମ୍ ପିଲା ଥିବା ଗୋଷ୍ଠୀର ତଥ୍ୟ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଲୁଚାଇ ଦିଆଯାଏ।',
      opportunity_gap: 'ସୁଯୋଗ ଅଭାବ ସ୍କୋର',
      active_athletes: 'ସକ୍ରିୟ ଖେଳାଳି',
      girls_participation: 'ଝିଅମାନଙ୍କ ଅଂଶଗ୍ରହଣ',
      completed_actions: 'ସମାପ୍ତ ହୋଇଥିବା କାର୍ଯ୍ୟ'
    }
  }
};

export function t(lang = 'en') {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
