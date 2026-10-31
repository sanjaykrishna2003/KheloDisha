# KheloDisha (ଖେଳୋଦିଶା / खेलो दिशा)

> **Empirical Sports Opportunity Decision-Support Platform for Odisha, Khelo India & Viksit Bharat @ 2047**

<div align="center">
  <img src="client/public/khelo-disha-logo.png" alt="Khelo Disha Logo" width="220" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="client/public/viksit-bharat-logo.png" alt="Viksit Bharat @ 2047" width="160" />
</div>

[![Tests](https://img.shields.io/badge/tests-17%20passed-success)](file:///c:/khelodisha/server/test)
[![Scoring Engine](https://img.shields.io/badge/scoring-exact%20acceptance%20match-teal)](file:///c:/khelodisha/server/src/scoring/engine.js)
[![Child Safety](https://img.shields.io/badge/privacy-mandatory%20consent%20gate-orange)](file:///c:/khelodisha/server/src/middleware/consentGate.js)
[![Mission](https://img.shields.io/badge/mission-Viksit%20Bharat%20%402047-blue)](file:///c:/khelodisha/client/src/services/i18n.js)
[![Languages](https://img.shields.io/badge/languages-English%20%7C%20हिन्दी%20%7C%20ଓଡ଼ିଆ-green)](file:///c:/khelodisha/client/src/services/i18n.js)

KheloDisha is a decision-support platform designed to help sports authorities in India pinpoint where children lack sporting opportunity, diagnose ground-level barriers, recommend high-efficiency evidence-based interventions, track actions with photographic proof, and measure real-world observed impact using quasi-experimental Difference-in-Differences (DiD), powering the national vision of **Viksit Bharat @ 2047** and the **Khelo India Mission**.

---

## 🏛 Core Principles

1. **Usable Ground Standard**: A facility counts as usable only if it is verified, has a coach present, and has functional equipment for that sport.
2. **Peer Group Normalization**: Compares only similar localities (e.g. rural plains low-income blocks) using min-max scaling ($0$ to $100$).
3. **Transparent Contributions & Confidence**: Every score displays weighted dimensions, top empirical barrier evidence, and confidence rating; thin data displays *"Insufficient data"*.
4. **The System Advises; Officers Decide**: Officers evaluate recommendations, adjust policy weights, and track implementation through a two-person verification rule.
5. **Observed Change, Not Proven Cause**: Program impact is measured against matched peer blocks and reported strictly as *"Observed change, not proven cause"*.
6. **Privacy & Child Safety by Design**: Mandatory guardian consent gate before saving any child record under 18, persistent pseudonymous identifiers (`PLY-XXXXX`), small-group suppression for $N < 10$, immutable audit logs, and zero adult-child messaging.

---

## 📐 Mathematical Formulation & Acceptance Matrix

Per locality and sport (Badminton):
- $\text{Unserved Demand \%} = \frac{\max(0, \text{Interested} - \text{Capacity})}{\text{Interested}} \times 100$
- $\text{Access Gap \%} = 100 - (\% \text{ of children within 5 km estimated straight-line reach of a usable facility})$
- $\text{Barrier Pressure \%} = \text{Trust-weighted percentage of respondents reporting any barrier}$
- $\text{Equity Gap} = 50 - \text{Girls' share of regular players (percentage points)}$

$$\text{Composite Gap Score} = 0.30 \times S_{\text{demand}} + 0.25 \times S_{\text{access}} + 0.25 \times S_{\text{barrier}} + 0.20 \times S_{\text{equity}}$$

### Benchmark Acceptance Results (Rural Plains Cluster, Sundargarh)

| Block | Raw Demand | Raw Access | Raw Barrier | Raw Equity | Scaled Demand | Scaled Access | Scaled Barrier | Scaled Equity | Gap Score | Top Contributions | Stability ($\pm 10\%$) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Block B** | 55.56% | 70.0% | 60.0% | 30.0 | 76.58 | 100.00 | 65.22 | 100.00 | **84.3** | Access (25.0), Equity (20.0) | **STABLE (Rank #1)** |
| **Block A** | 70.00% | 45.0% | 76.0% | 20.0 | 100.00 | 44.44 | 100.00 | 60.00 | **78.1** | Demand (30.0), Barrier (25.0) | **STABLE (Rank #2)** |
| **Block D** | 37.50% | 35.0% | 50.0% | 5.0 | 47.30 | 22.22 | 43.48 | 0.00 | **30.6** | Demand (14.2), Barrier (10.9) | **STABLE (Rank #3)** |
| **Block C** | 8.33% | 25.0% | 30.0% | 10.0 | 0.00 | 0.00 | 0.00 | 20.00 | **4.0** | Equity (4.0) | **STABLE (Rank #4)** |

- **Quasi-Experimental Impact (DiD)**:
  - Treated Block B: $35 \to 68$ attendees/week ($\Delta = +33$)
  - Matched Control Block E: $38 \to 44$ attendees/week ($\Delta = +6$)
  - Observed Net Effect: $(68 - 35) - (44 - 38) = 33 - 6 = \mathbf{27 \text{ regular attendees/week}}$
  - Block B unserved demand before: **55.6%**; post-fix: **24.4%** ($90$ interested, $68$ attending).

---

## 🏗 Four-Layer Architecture

1. **Data Layer (`server/src/db/`)**:
   - Relational schema compatible with SQLite / MySQL.
   - Tables: `users`, `consents`, `players`, `localities`, `facilities`, `sessions_attendance`, `barrier_reports`, `gap_scores`, `interventions`, `recommendations`, `actions`, `impact_snapshots`, `sponsors`, `funding`, `audit_log`.
2. **Scoring Engine (`server/src/scoring/`)**:
   - Completely decoupled pure functions with zero DB or web dependencies.
   - Modules for trust-weighting, deduplication, peer-group scaling, confidence calculation, shrinkage ($k=10$), and sensitivity analysis.
3. **API Layer (`server/src/routes/` & `middleware/`)**:
   - Express server with JWT auth and role validation.
   - Mandatory parental consent interceptor, pseudonymous data sanitizer, small-group suppression (<10), and automated audit logger.
4. **Interface Layer (`client/src/`)**:
   - Mobile-first React (Vite) PWA with Tailwind CSS, Recharts, and Leaflet (OpenStreetMap tiles, free, no API keys).
   - High-contrast Navy/Teal/Saffron palette, large touch targets, Odia/English toggle, and offline IndexedDB queue.

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### 1. Install Dependencies
```bash
# In backend
cd server
npm install

# In frontend
cd ../client
npm install
```

### 2. Initialize Database & Seed Benchmark Data
```bash
cd ../server
npm run db:init
```
This sets up all 15 tables and seeds Blocks A, B, C, D, E, users, facilities, and initial intervention recommendations. All simulated data is flagged with `is_simulated = 1`.

### 3. Run Automated Tests
```bash
cd ../server
npm test
```
Runs all 17 unit and integration tests (scoring accuracy, ranking stability, parental consent gate, two-person rule, DiD effect, and small group privacy).

### 4. Build and Start the Application
```bash
# Build frontend bundle
cd ../client
npm run build

# Start integrated server (serves API and UI at http://localhost:5000)
cd ../server
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

*(Optional for frontend hot-reload: run `npm run dev` in `client` on port 3000).*

---

## 👥 Demo Personas & Role Switching

Use the **Switch Demo Persona** dropdown in the top navigation bar to test all views instantly:

| Persona | Role | Default Username | Password | Key Views |
|---|---|---|---|---|
| **Smt. Minati Behera** | `officer` (District) | `officer.district@khelodisha.gov.in` | `Officer@123` | GIS Map, Recompute Weights, Overdue Escalations, DiD Impact |
| **Shri Rakesh Nayak** | `officer` (Block) | `officer.block_b@khelodisha.gov.in` | `Officer@123` | Bargaon Detail, Approve Recommendations, Action Board |
| **Pradeep Mohanty** | `teacher_coach` | `coach.sundargarh@khelodisha.gov.in` | `Coach@123` | Facility Registry, Attendance Log, Confirm Barrier Reports |
| **Manoj Kumar Oram** | `player_parent` | `parent.rahul@khelodisha.gov.in` | `Parent@123` | Consent Form, Register Athlete, Revoke Consent, Offline Report |
| **Tata Steel CSR** | `sponsor` | `csr.tatasteel@sports.org` | `Sponsor@123` | CSR Matchmaking (Fit vs Need), Pledge Funding, Aggregated Impact |
| **Public Citizen** | `public` | `public@khelodisha.gov.in` | `Public@123` | Public Scorecard (strictly zero PII, small groups suppressed) |
| **Dr. Debabrata Samal** | `admin` | `admin@khelodisha.gov.in` | `Admin@123` | Full Access & Immutable Audit Log Viewer |

---

## 📴 Offline Support & Conflict Rules

- When the device is offline, barrier reports and session attendance are queued locally in the browser.
- A prominent orange **"Pending Sync"** pill indicates unsaved items.
- Upon reconnection (or clicking the sync button), queued items are sent to the backend in a batch.
- **Conflict Resolution**: Teacher-confirmed reports take precedence over unconfirmed self-reports ($0.8$ vs $0.5$ trust weight). All transitions are preserved in the audit log.

---

## 📄 License
Released for sports governance decision support under the Khelo India Mission.
