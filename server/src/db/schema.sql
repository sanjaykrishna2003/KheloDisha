-- KheloDisha Relational Schema (SQLite / MySQL compatible DDL)

-- 1. Localities (Blocks / Panchayats / Wards)
CREATE TABLE IF NOT EXISTS localities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    block TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Odisha',
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    terrain TEXT NOT NULL, -- 'plains', 'coastal', 'hilly'
    density_class TEXT NOT NULL, -- 'rural', 'semi_urban', 'urban'
    income_class TEXT NOT NULL, -- 'low', 'medium', 'high'
    child_population INTEGER NOT NULL,
    peer_group TEXT NOT NULL, -- e.g. 'rural_plains_low_income'
    is_simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Authentication and authorization)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('player_parent', 'teacher_coach', 'officer', 'sponsor', 'public', 'admin')),
    officer_level TEXT CHECK(officer_level IN ('block', 'district', NULL)),
    full_name TEXT NOT NULL,
    locality_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 3. Consents (Parental Consent Gate for Children < 18)
CREATE TABLE IF NOT EXISTS consents (
    id TEXT PRIMARY KEY,
    player_pseudo_id TEXT UNIQUE NOT NULL,
    guardian_name TEXT NOT NULL,
    guardian_contact TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'granted', 'withdrawn')),
    granted_at DATETIME,
    withdrawn_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Players (Under 18, strictly pseudonymous in analytics)
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    pseudo_id TEXT UNIQUE NOT NULL,
    age_band TEXT NOT NULL, -- 'under_10', '10_14', '15_17'
    gender TEXT NOT NULL CHECK(gender IN ('female', 'male', 'other')),
    school TEXT,
    locality_id TEXT NOT NULL,
    sport_interest TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    consent_id TEXT,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id),
    FOREIGN KEY(consent_id) REFERENCES consents(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 5. Facilities (Sports grounds, courts, halls)
CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    sports TEXT NOT NULL, -- JSON array string or comma separated e.g. 'badminton,football'
    equipment_ok INTEGER NOT NULL DEFAULT 0,
    coach_present INTEGER NOT NULL DEFAULT 0,
    weekly_sessions INTEGER NOT NULL DEFAULT 0,
    participants_per_session INTEGER NOT NULL DEFAULT 0,
    fee_level TEXT NOT NULL CHECK(fee_level IN ('free', 'nominal', 'expensive')),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified', 'teacher_confirmed', 'officer_verified')),
    is_simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 6. Sessions & Attendance
CREATE TABLE IF NOT EXISTS sessions_attendance (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL,
    locality_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    date DATE NOT NULL,
    attendee_count INTEGER NOT NULL,
    girls_count INTEGER NOT NULL,
    reporter_id TEXT,
    is_simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(facility_id) REFERENCES facilities(id),
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 7. Barrier Reports (Fixed categories with trust levels)
CREATE TABLE IF NOT EXISTS barrier_reports (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('no_ground', 'no_coach', 'cost', 'distance', 'safety', 'equipment', 'overcrowding', 'awareness', 'exams')),
    reporter_role TEXT NOT NULL CHECK(reporter_role IN ('player_parent', 'teacher_coach', 'officer')),
    trust_level REAL NOT NULL DEFAULT 0.5, -- 0.5 for player_parent, 0.8 for teacher_confirmed, 1.0 for officer_verified
    reporter_pseudo_id TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'teacher_confirmed', 'officer_verified')),
    date DATE NOT NULL,
    is_simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 8. Gap Scores (Computed by pure scoring engine per locality and sport)
CREATE TABLE IF NOT EXISTS gap_scores (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    date DATE NOT NULL,
    score REAL NOT NULL,
    unserved_demand_pct REAL NOT NULL,
    access_gap_pct REAL NOT NULL,
    barrier_pressure_pct REAL NOT NULL,
    equity_gap_pct REAL NOT NULL,
    scaled_unserved_demand REAL NOT NULL,
    scaled_access_gap REAL NOT NULL,
    scaled_barrier_pressure REAL NOT NULL,
    scaled_equity_gap REAL NOT NULL,
    contributions_json TEXT NOT NULL,
    top_barriers_json TEXT NOT NULL,
    confidence REAL NOT NULL,
    confidence_label TEXT NOT NULL, -- 'High', 'Medium', 'Insufficient data'
    stability_status TEXT NOT NULL DEFAULT 'stable',
    weights_json TEXT NOT NULL,
    is_simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 9. Interventions Library (Catalog of evidence-based interventions)
CREATE TABLE IF NOT EXISTS interventions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    barrier_addressed TEXT NOT NULL, -- Comma-separated or JSON e.g. 'cost,no_coach'
    preconditions TEXT,
    fixed_cost REAL NOT NULL,
    cost_per_child REAL NOT NULL,
    max_reach INTEGER NOT NULL,
    time_to_start TEXT NOT NULL,
    description TEXT NOT NULL
);

-- 10. Recommendations (System advice for officer decision)
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    intervention_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    expected_reach INTEGER NOT NULL,
    cost REAL NOT NULL,
    cost_per_child REAL NOT NULL,
    reach_per_rupee REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'recommended' CHECK(status IN ('recommended', 'approved', 'rejected')),
    officer_notes TEXT,
    approved_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id),
    FOREIGN KEY(intervention_id) REFERENCES interventions(id)
);

-- 11. Actions (Execution tracking with photographic proof & dual confirmation)
CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    recommendation_id TEXT,
    locality_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    budget REAL NOT NULL,
    deadline DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('recommended', 'approved', 'in_progress', 'done', 'verified', 'closed')),
    proof_url TEXT,
    proof_timestamp DATETIME,
    proof_lat REAL,
    proof_lon REAL,
    second_confirmer TEXT,
    is_overdue INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(recommendation_id) REFERENCES recommendations(id),
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 12. Impact Snapshots (Before vs After difference-in-differences)
CREATE TABLE IF NOT EXISTS impact_snapshots (
    id TEXT PRIMARY KEY,
    locality_id TEXT NOT NULL,
    date DATE NOT NULL,
    attendance REAL NOT NULL,
    access_index REAL NOT NULL,
    retention REAL NOT NULL,
    gap_score REAL NOT NULL,
    comparison_ids TEXT NOT NULL, -- JSON array of matched comparison locality IDs
    snapshot_type TEXT NOT NULL CHECK(snapshot_type IN ('baseline', 'month_3', 'month_6')),
    observed_effect REAL,
    sample_size INTEGER NOT NULL,
    is_simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(locality_id) REFERENCES localities(id)
);

-- 13. Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    focus_sports TEXT NOT NULL,
    focus_districts TEXT NOT NULL,
    total_budget REAL NOT NULL,
    committed_budget REAL NOT NULL DEFAULT 0
);

-- 14. Funding
CREATE TABLE IF NOT EXISTS funding (
    id TEXT PRIMARY KEY,
    sponsor_id TEXT NOT NULL,
    locality_id TEXT NOT NULL,
    action_id TEXT,
    amount REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pledged', 'committed', 'disbursed')),
    date DATE NOT NULL,
    FOREIGN KEY(sponsor_id) REFERENCES sponsors(id),
    FOREIGN KEY(locality_id) REFERENCES localities(id),
    FOREIGN KEY(action_id) REFERENCES actions(id)
);

-- 15. Audit Log (Mandatory for all sensitive operations)
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance and quick filtering
CREATE INDEX IF NOT EXISTS idx_localities_peer_group ON localities(peer_group);
CREATE INDEX IF NOT EXISTS idx_facilities_locality ON facilities(locality_id);
CREATE INDEX IF NOT EXISTS idx_reports_locality_sport ON barrier_reports(locality_id, sport);
CREATE INDEX IF NOT EXISTS idx_gap_scores_locality_sport ON gap_scores(locality_id, sport);
CREATE INDEX IF NOT EXISTS idx_actions_locality ON actions(locality_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
