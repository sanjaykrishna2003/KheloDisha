// Database Seeder for KheloDisha
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { exec, run, query, get } = require('./database');

async function seed() {
    console.log('--- Initializing KheloDisha Database Schema ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    exec(schemaSql);
    console.log('Schema executed successfully.');

    console.log('--- Cleaning Existing Simulated Records ---');
    // Delete in reverse FK order
    exec(`
        DELETE FROM audit_log;
        DELETE FROM funding;
        DELETE FROM sponsors;
        DELETE FROM impact_snapshots;
        DELETE FROM actions;
        DELETE FROM recommendations;
        DELETE FROM interventions;
        DELETE FROM gap_scores;
        DELETE FROM barrier_reports;
        DELETE FROM sessions_attendance;
        DELETE FROM facilities;
        DELETE FROM players;
        DELETE FROM consents;
        DELETE FROM users;
        DELETE FROM localities;
    `);

    console.log('--- Seeding Localities ---');
    // 5 Blocks in District Sundargarh (4 demo blocks + 1 comparison block)
    const localities = [
        {
            id: 'LOC-BLOCK-A',
            name: 'Kutra Block (Block A)',
            block: 'Block A',
            district: 'Sundargarh',
            state: 'Odisha',
            lat: 22.2500,
            lon: 84.2000,
            terrain: 'plains',
            density_class: 'rural',
            income_class: 'low',
            child_population: 1420,
            peer_group: 'rural_plains_low_income',
            is_simulated: 1
        },
        {
            id: 'LOC-BLOCK-B',
            name: 'Bargaon Block (Block B)',
            block: 'Block B',
            district: 'Sundargarh',
            state: 'Odisha',
            lat: 22.1800,
            lon: 84.3500,
            terrain: 'plains',
            density_class: 'rural',
            income_class: 'low',
            child_population: 1280,
            peer_group: 'rural_plains_low_income',
            is_simulated: 1
        },
        {
            id: 'LOC-BLOCK-C',
            name: 'Subdega Block (Block C)',
            block: 'Block C',
            district: 'Sundargarh',
            state: 'Odisha',
            lat: 22.3500,
            lon: 84.1000,
            terrain: 'plains',
            density_class: 'rural',
            income_class: 'low',
            child_population: 1150,
            peer_group: 'rural_plains_low_income',
            is_simulated: 1
        },
        {
            id: 'LOC-BLOCK-D',
            name: 'Balishankara Block (Block D)',
            block: 'Block D',
            district: 'Sundargarh',
            state: 'Odisha',
            lat: 22.3800,
            lon: 84.2800,
            terrain: 'plains',
            density_class: 'rural',
            income_class: 'low',
            child_population: 1310,
            peer_group: 'rural_plains_low_income',
            is_simulated: 1
        },
        {
            id: 'LOC-BLOCK-E',
            name: 'Lephripara Block (Block E - Comparison for B)',
            block: 'Block E',
            district: 'Sundargarh',
            state: 'Odisha',
            lat: 22.0500,
            lon: 83.8200,
            terrain: 'plains',
            density_class: 'rural',
            income_class: 'low',
            child_population: 1250,
            peer_group: 'rural_plains_low_income',
            is_simulated: 1
        }
    ];

    for (const loc of localities) {
        run(`
            INSERT INTO localities (id, name, block, district, state, lat, lon, terrain, density_class, income_class, child_population, peer_group, is_simulated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [loc.id, loc.name, loc.block, loc.district, loc.state, loc.lat, loc.lon, loc.terrain, loc.density_class, loc.income_class, loc.child_population, loc.peer_group, loc.is_simulated]);
    }

    console.log('--- Seeding Users ---');
    const saltRounds = 8;
    const defaultUsers = [
        {
            id: 'USR-ADMIN',
            username: 'admin@khelodisha.gov.in',
            password: 'Admin@123',
            role: 'admin',
            officer_level: null,
            full_name: 'Dr. Debabrata Samal (Director Sports)',
            locality_id: null
        },
        {
            id: 'USR-OFFICER-DISTRICT',
            username: 'officer.district@khelodisha.gov.in',
            password: 'Officer@123',
            role: 'officer',
            officer_level: 'district',
            full_name: 'Smt. Minati Behera (District Sports Officer)',
            locality_id: 'LOC-BLOCK-B'
        },
        {
            id: 'USR-OFFICER-BLOCK',
            username: 'officer.block_b@khelodisha.gov.in',
            password: 'Officer@123',
            role: 'officer',
            officer_level: 'block',
            full_name: 'Shri Rakesh Nayak (Block Development Officer Bargaon)',
            locality_id: 'LOC-BLOCK-B'
        },
        {
            id: 'USR-TEACHER',
            username: 'coach.sundargarh@khelodisha.gov.in',
            password: 'Coach@123',
            role: 'teacher_coach',
            officer_level: null,
            full_name: 'Pradeep Mohanty (Physical Education Teacher)',
            locality_id: 'LOC-BLOCK-B'
        },
        {
            id: 'USR-PARENT',
            username: 'parent.rahul@khelodisha.gov.in',
            password: 'Parent@123',
            role: 'player_parent',
            officer_level: null,
            full_name: 'Manoj Kumar Oram (Guardian)',
            locality_id: 'LOC-BLOCK-B'
        },
        {
            id: 'USR-SPONSOR',
            username: 'csr.tatasteel@sports.org',
            password: 'Sponsor@123',
            role: 'sponsor',
            officer_level: null,
            full_name: 'Tata Steel Sports Foundation CSR',
            locality_id: null
        },
        {
            id: 'USR-PUBLIC',
            username: 'public@khelodisha.gov.in',
            password: 'Public@123',
            role: 'public',
            officer_level: null,
            full_name: 'Public Citizen / Scorecard Viewer',
            locality_id: null
        }
    ];

    for (const u of defaultUsers) {
        const hash = bcrypt.hashSync(u.password, saltRounds);
        run(`
            INSERT INTO users (id, username, password_hash, role, officer_level, full_name, locality_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [u.id, u.username, hash, u.role, u.officer_level, u.full_name, u.locality_id]);
    }

    console.log('--- Seeding Consents and Players ---');
    // Create parent consent and player
    const consentId = 'CNS-90214';
    const playerPseudoId = 'PLY-04829';
    run(`
        INSERT INTO consents (id, player_pseudo_id, guardian_name, guardian_contact, purpose, status, granted_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [consentId, playerPseudoId, 'Manoj Kumar Oram', '+91 94370 12345', 'Khelo India Badminton coaching and tournament participation', 'granted']);

    run(`
        INSERT INTO players (id, pseudo_id, age_band, gender, school, locality_id, sport_interest, is_active, consent_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['PLY-REC-01', playerPseudoId, '10_14', 'female', 'Bargaon Govt High School', 'LOC-BLOCK-B', 'badminton', 1, consentId, 'USR-PARENT']);

    // Seed additional pseudonymous players across blocks for demographic counts (all >= 10 for suppression compliance)
    const seedDemographics = [
        { blockId: 'LOC-BLOCK-A', interested: 100, girls: 30 },
        { blockId: 'LOC-BLOCK-B', interested: 90, girls: 18 },
        { blockId: 'LOC-BLOCK-C', interested: 60, girls: 24 },
        { blockId: 'LOC-BLOCK-D', interested: 80, girls: 36 },
        { blockId: 'LOC-BLOCK-E', interested: 85, girls: 35 }
    ];

    let pIdx = 100;
    for (const demo of seedDemographics) {
        for (let i = 0; i < demo.interested; i++) {
            pIdx++;
            const pId = `PLY-${pIdx}`;
            const gender = i < demo.girls ? 'female' : 'male';
            const cId = `CNS-${pIdx}`;
            run(`
                INSERT INTO consents (id, player_pseudo_id, guardian_name, guardian_contact, purpose, status, granted_at)
                VALUES (?, ?, ?, ?, ?, 'granted', CURRENT_TIMESTAMP)
            `, [cId, pId, `Guardian ${pIdx}`, '+91 98000 00000', 'Khelo India Youth Sports Consent']);

            run(`
                INSERT INTO players (id, pseudo_id, age_band, gender, school, locality_id, sport_interest, is_active, consent_id)
                VALUES (?, ?, '10_14', ?, 'Govt Nodal High School', ?, 'badminton', 1, ?)
            `, [`REC-${pIdx}`, pId, gender, demo.blockId, cId]);
        }
    }

    console.log('--- Seeding Facilities ---');
    // Facilities matching seed parameters:
    // Block A: capacity 30, coach 1, equip 1
    // Block B: capacity 40, coach 1, equip 1
    // Block C: capacity 55, coach 1, equip 1
    // Block D: capacity 50, coach 1, equip 1
    // Block E: capacity 40, coach 1, equip 1
    const facilities = [
        {
            id: 'FAC-A1',
            locality_id: 'LOC-BLOCK-A',
            name: 'Kutra Block Sports Ground & Badminton Court',
            lat: 22.2510,
            lon: 84.2020,
            sports: 'badminton,football',
            equipment_ok: 1,
            coach_present: 1,
            weekly_sessions: 3,
            participants_per_session: 10, // Total weekly capacity = 30
            fee_level: 'free',
            verification_status: 'officer_verified'
        },
        {
            id: 'FAC-B1',
            locality_id: 'LOC-BLOCK-B',
            name: 'Bargaon Community Badminton Shed',
            lat: 22.1820,
            lon: 84.3510,
            sports: 'badminton',
            equipment_ok: 1,
            coach_present: 1,
            weekly_sessions: 2,
            participants_per_session: 20, // Total capacity = 40
            fee_level: 'nominal',
            verification_status: 'officer_verified'
        },
        {
            id: 'FAC-C1',
            locality_id: 'LOC-BLOCK-C',
            name: 'Subdega Youth Sports Complex',
            lat: 22.3520,
            lon: 84.1020,
            sports: 'badminton,volleyball',
            equipment_ok: 1,
            coach_present: 1,
            weekly_sessions: 5,
            participants_per_session: 11, // Total capacity = 55
            fee_level: 'free',
            verification_status: 'officer_verified'
        },
        {
            id: 'FAC-D1',
            locality_id: 'LOC-BLOCK-D',
            name: 'Balishankara Block Stadium Court',
            lat: 22.3810,
            lon: 84.2810,
            sports: 'badminton',
            equipment_ok: 1,
            coach_present: 1,
            weekly_sessions: 5,
            participants_per_session: 10, // Total capacity = 50
            fee_level: 'nominal',
            verification_status: 'officer_verified'
        },
        {
            id: 'FAC-E1',
            locality_id: 'LOC-BLOCK-E',
            name: 'Lephripara Rural Sports Ground',
            lat: 22.0520,
            lon: 83.8210,
            sports: 'badminton',
            equipment_ok: 1,
            coach_present: 1,
            weekly_sessions: 4,
            participants_per_session: 10,
            fee_level: 'free',
            verification_status: 'officer_verified'
        }
    ];

    for (const f of facilities) {
        run(`
            INSERT INTO facilities (id, locality_id, name, lat, lon, sports, equipment_ok, coach_present, weekly_sessions, participants_per_session, fee_level, verification_status, is_simulated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [f.id, f.locality_id, f.name, f.lat, f.lon, f.sports, f.equipment_ok, f.coach_present, f.weekly_sessions, f.participants_per_session, f.fee_level, f.verification_status]);
    }

    console.log('--- Seeding Barrier Reports ---');
    // Block A: 38 of 50 respondents report barrier (76%) -> top: no_ground, overcrowding
    // Block B: 27 of 45 respondents report barrier (60%) -> top: distance, safety, no_coach
    // Block C: 12 of 40 respondents report barrier (30%) -> top: exams, awareness
    // Block D: 20 of 40 respondents report barrier (50%) -> top: cost, equipment
    const barrierSpecs = [
        {
            locality_id: 'LOC-BLOCK-A',
            totalRespondents: 50,
            barrierCount: 38,
            primary: 'no_ground',
            secondary: 'overcrowding'
        },
        {
            locality_id: 'LOC-BLOCK-B',
            totalRespondents: 45,
            barrierCount: 27,
            primary: 'distance',
            secondary: 'safety'
        },
        {
            locality_id: 'LOC-BLOCK-C',
            totalRespondents: 40,
            barrierCount: 12,
            primary: 'exams',
            secondary: 'awareness'
        },
        {
            locality_id: 'LOC-BLOCK-D',
            totalRespondents: 40,
            barrierCount: 20,
            primary: 'cost',
            secondary: 'equipment'
        }
    ];

    let bIdx = 0;
    const nowIso = new Date().toISOString().split('T')[0];
    for (const spec of barrierSpecs) {
        for (let i = 0; i < spec.totalRespondents; i++) {
            bIdx++;
            const isBarrier = i < spec.barrierCount;
            if (isBarrier) {
                // alternate between primary, secondary, and a third barrier
                let cat = spec.primary;
                if (i % 3 === 1) cat = spec.secondary;
                else if (i % 3 === 2) cat = (spec.locality_id === 'LOC-BLOCK-B') ? 'no_coach' : 'cost';

                run(`
                    INSERT INTO barrier_reports (id, locality_id, sport, category, reporter_role, trust_level, reporter_pseudo_id, status, notes, date, is_simulated)
                    VALUES (?, ?, 'badminton', ?, 'player_parent', 1.0, ?, 'teacher_confirmed', ?, ?, 1)
                `, [`REP-${bIdx}`, spec.locality_id, cat, `PLY-SIM-${bIdx}`, `Reported barrier: ${cat}`, nowIso]);
            }
        }
    }

    console.log('--- Seeding Interventions Library ---');
    const interventions = [
        {
            id: 'INT-COACHING',
            name: 'Subsidised Shared Coaching',
            barrier_addressed: 'cost,no_coach',
            preconditions: 'Functional court with lighting or day-time access',
            fixed_cost: 90000,
            cost_per_child: 2250,
            max_reach: 40,
            time_to_start: '2 weeks',
            description: 'Deploy qualified regional badminton coach for 3 sessions/week with subsidized player fees.'
        },
        {
            id: 'INT-HUB-TRANSPORT',
            name: 'Shared Hub Transport & Female Coach',
            barrier_addressed: 'distance,safety,no_coach',
            preconditions: 'Designated safe pickup cluster points with parent chaperone',
            fixed_cost: 240000,
            cost_per_child: 4800,
            max_reach: 50,
            time_to_start: '3 weeks',
            description: 'Dedicated electric van/bus route to central sports hub with certified female coach to ensure safety and boost girls participation.'
        },
        {
            id: 'INT-EQUIPMENT-KIT',
            name: 'Youth Badminton Equipment Kit',
            barrier_addressed: 'equipment',
            preconditions: 'Secure lockable storage in village school or panchayat office',
            fixed_cost: 35000,
            cost_per_child: 583,
            max_reach: 60,
            time_to_start: '1 week',
            description: 'Provides 24 tournament grade rackets, 50 shuttle tubes, net post systems, and grip replacements.'
        },
        {
            id: 'INT-SHARED-GROUND',
            name: 'Shared School Ground Lighting & Access',
            barrier_addressed: 'no_ground',
            preconditions: 'School ground within 3 km with formal MOU',
            fixed_cost: 50000,
            cost_per_child: 625,
            max_reach: 80,
            time_to_start: '2 weeks',
            description: 'Dual-use agreement with School and Mass Education Dept for evening court access with LED solar floodlights.'
        },
        {
            id: 'INT-VISITING-COACH',
            name: 'Visiting Roving Badminton Coach Circuit',
            barrier_addressed: 'no_coach',
            preconditions: 'Basic court surface available',
            fixed_cost: 60000,
            cost_per_child: 1200,
            max_reach: 50,
            time_to_start: '1 week',
            description: 'Certified coach visits 3 rural blocks on rotation twice weekly for structured drills.'
        }
    ];

    for (const item of interventions) {
        run(`
            INSERT INTO interventions (id, name, barrier_addressed, preconditions, fixed_cost, cost_per_child, max_reach, time_to_start, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [item.id, item.name, item.barrier_addressed, item.preconditions, item.fixed_cost, item.cost_per_child, item.max_reach, item.time_to_start, item.description]);
    }

    console.log('--- Seeding Sessions & Attendance for Difference-in-Differences ---');
    // Block B weekly attendance: 35 before (7 girls), 68 after (32 girls)
    // Block E weekly attendance: 38 before (16 girls), 44 after (19 girls)
    // 4 weeks of baseline, 4 weeks of post-fix
    const baselineDates = ['2026-06-05', '2026-06-12', '2026-06-19', '2026-06-26'];
    const postfixDates = ['2026-09-04', '2026-09-11', '2026-09-18', '2026-09-25'];

    for (const d of baselineDates) {
        // Block B baseline
        run(`
            INSERT INTO sessions_attendance (id, facility_id, locality_id, sport, date, attendee_count, girls_count, reporter_id, is_simulated)
            VALUES (?, 'FAC-B1', 'LOC-BLOCK-B', 'badminton', ?, 35, 7, 'USR-TEACHER', 1)
        `, [`ATT-B-BASE-${d}`, d]);

        // Block E baseline
        run(`
            INSERT INTO sessions_attendance (id, facility_id, locality_id, sport, date, attendee_count, girls_count, reporter_id, is_simulated)
            VALUES (?, 'FAC-E1', 'LOC-BLOCK-E', 'badminton', ?, 38, 16, 'USR-TEACHER', 1)
        `, [`ATT-E-BASE-${d}`, d]);
    }

    for (const d of postfixDates) {
        // Block B post-fix
        run(`
            INSERT INTO sessions_attendance (id, facility_id, locality_id, sport, date, attendee_count, girls_count, reporter_id, is_simulated)
            VALUES (?, 'FAC-B1', 'LOC-BLOCK-B', 'badminton', ?, 68, 32, 'USR-TEACHER', 1)
        `, [`ATT-B-POST-${d}`, d]);

        // Block E post-fix
        run(`
            INSERT INTO sessions_attendance (id, facility_id, locality_id, sport, date, attendee_count, girls_count, reporter_id, is_simulated)
            VALUES (?, 'FAC-E1', 'LOC-BLOCK-E', 'badminton', ?, 44, 19, 'USR-TEACHER', 1)
        `, [`ATT-E-POST-${d}`, d]);
    }

    console.log('--- Seeding Impact Snapshots ---');
    // Baseline snapshot for Block B
    run(`
        INSERT INTO impact_snapshots (id, locality_id, date, attendance, access_index, retention, gap_score, comparison_ids, snapshot_type, observed_effect, sample_size, is_simulated)
        VALUES ('IMP-B-BASE', 'LOC-BLOCK-B', '2026-06-30', 35.0, 30.0, 0.55, 84.3, '["LOC-BLOCK-E"]', 'baseline', 0.0, 45, 1)
    `);

    // Month 3 snapshot for Block B (Observed difference in attendance change: (68 - 35) - (44 - 38) = 33 - 6 = 27 attendees/week)
    run(`
        INSERT INTO impact_snapshots (id, locality_id, date, attendance, access_index, retention, gap_score, comparison_ids, snapshot_type, observed_effect, sample_size, is_simulated)
        VALUES ('IMP-B-M3', 'LOC-BLOCK-B', '2026-09-30', 68.0, 75.0, 0.82, 38.5, '["LOC-BLOCK-E"]', 'month_3', 27.0, 68, 1)
    `);

    console.log('--- Seeding Sponsors and Funding ---');
    run(`
        INSERT INTO sponsors (id, name, contact_email, focus_sports, focus_districts, total_budget, committed_budget)
        VALUES ('SPN-TATA', 'Tata Steel Sports CSR', 'csr@tatasteel.com', 'badminton,hockey', 'Sundargarh,Keonjhar', 2500000, 480000)
    `);

    run(`
        INSERT INTO funding (id, sponsor_id, locality_id, action_id, amount, status, date)
        VALUES ('FND-001', 'SPN-TATA', 'LOC-BLOCK-B', NULL, 240000, 'committed', '2026-07-01')
    `);

    console.log('--- Seeding Initial Audit Log ---');
    run(`
        INSERT INTO audit_log (id, user_id, user_role, action, entity_type, entity_id, details, ip_address)
        VALUES ('AUD-INIT', 'USR-ADMIN', 'admin', 'SYSTEM_SEED', 'database', 'all', 'Seeded initial simulated blocks A, B, C, D, E for Sundargarh district with Khelo India parameters', '127.0.0.1')
    `);

    console.log('✅ KheloDisha database seeded successfully!');
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
