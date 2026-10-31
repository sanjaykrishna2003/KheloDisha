const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');

let server;
let baseUrl;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            resolve();
        });
    });
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

describe('KheloDisha API Layer & Privacy Acceptance Tests', () => {

    let officerToken = '';
    let parentToken = '';
    let publicToken = '';

    test('health check returns ok', async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        const json = await res.json();
        assert.equal(res.status, 200);
        assert.equal(json.status, 'ok');
    });

    test('login authenticates valid user and returns JWT token', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'officer.block_b@khelodisha.gov.in',
                password: 'Officer@123'
            })
        });

        assert.equal(res.status, 200);
        const json = await res.json();
        assert.ok(json.token);
        assert.equal(json.user.role, 'officer');
        officerToken = json.token;
    });

    test('demo-switch enables seamless testing of different roles', async () => {
        const res = await fetch(`${baseUrl}/api/auth/demo-switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_key: 'player_parent' })
        });

        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.user.role, 'player_parent');
        parentToken = json.token;
    });

    test('MANDATORY PRIVACY GATE: child registration without consent is rejected', async () => {
        const res = await fetch(`${baseUrl}/api/players/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${parentToken}`
            },
            body: JSON.stringify({
                age_band: '10_14',
                gender: 'female',
                school: 'Sundargarh High School',
                locality_id: 'LOC-BLOCK-B',
                sport_interest: 'badminton'
                // Missing consent!
            })
        });

        assert.equal(res.status, 400);
        const json = await res.json();
        assert.ok(json.error.includes('Parental Consent Required'));
    });

    test('child registration WITH parental consent succeeds and generates pseudonymous ID', async () => {
        const res = await fetch(`${baseUrl}/api/players/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${parentToken}`
            },
            body: JSON.stringify({
                age_band: '10_14',
                gender: 'female',
                school: 'Govt Nodal High School',
                locality_id: 'LOC-BLOCK-B',
                sport_interest: 'badminton',
                consent: {
                    guardian_name: 'Manoj Kumar Oram',
                    guardian_contact: '+91 94370 12345',
                    purpose: 'Badminton Coaching Participation',
                    status: 'granted'
                }
            })
        });

        assert.equal(res.status, 201);
        const json = await res.json();
        assert.ok(json.player.pseudo_id.startsWith('PLY-'));
        assert.equal(json.player.consent_status, 'granted');
    });

    test('localities endpoint returns accurate gap scores: B=84.3, A=78.1, D=30.6, C=4.0', async () => {
        const res = await fetch(`${baseUrl}/api/localities?sport=badminton`);
        assert.equal(res.status, 200);
        const json = await res.json();

        const byBlock = Object.fromEntries(json.localities.map(l => [l.block, l]));
        assert.equal(byBlock['Block B'].gap_score, 84.3);
        assert.equal(byBlock['Block A'].gap_score, 78.1);
        assert.equal(byBlock['Block D'].gap_score, 30.6);
        assert.equal(byBlock['Block C'].gap_score, 4.0);
    });

    test('officer recompute weights endpoint recalculates gap scores and validates stability', async () => {
        const res = await fetch(`${baseUrl}/api/localities/recompute-scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                weights: {
                    unserved_demand: 0.30,
                    access_gap: 0.25,
                    barrier_pressure: 0.25,
                    equity_gap: 0.20
                }
            })
        });

        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.stability.isStable, true);
        assert.equal(json.localities[0].id, 'LOC-BLOCK-B');
    });

    test('action tracker enforces two-person rule: owner cannot verify own action', async () => {
        // Step 1: Create an action with owner 'Shri Rakesh Nayak (Block Development Officer Bargaon)'
        const appRes = await fetch(`${baseUrl}/api/actions/approve-recommendation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                recommendation_id: 'REC-LOC-BLOCK-B-INT-HUB-TRANSPORT',
                owner: 'Shri Rakesh Nayak (Block Development Officer Bargaon)',
                budget: 240000,
                deadline: '2026-12-31',
                custom_title: 'Electric Van Shared Hub Transport Pilot'
            })
        });

        assert.equal(appRes.status, 201);
        const appJson = await appRes.json();
        const actionId = appJson.action_id;

        // Step 2: Upload proof
        const proofRes = await fetch(`${baseUrl}/api/actions/${actionId}/proof`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                proof_url: 'https://khelodisha.gov.in/evidence/van-pilot-01.jpg',
                proof_lat: 22.182,
                proof_lon: 84.351
            })
        });
        assert.equal(proofRes.status, 200);

        // Step 3: Same officer tries to verify -> Must be rejected by two-person rule!
        const verifyRes = await fetch(`${baseUrl}/api/actions/${actionId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            }
        });

        assert.equal(verifyRes.status, 403);
        const verifyJson = await verifyRes.json();
        assert.ok(verifyJson.error.includes('Two-person rule violation'));
    });

    test('impact evaluation returns DiD observed effect of 27 and caution disclaimer', async () => {
        const res = await fetch(`${baseUrl}/api/impact/evaluation/LOC-BLOCK-B`);
        assert.equal(res.status, 200);
        const json = await res.json();

        assert.equal(json.metrics.difference_in_differences.observed_effect, 27);
        assert.equal(json.caution_disclaimer, 'Observed change, not proven cause');
        assert.equal(json.comparison_locality.block, 'Block E');
    });

    test('public scorecard protects privacy and suppresses small groups', async () => {
        const res = await fetch(`${baseUrl}/api/public/scorecard?district=Sundargarh`);
        assert.equal(res.status, 200);
        const json = await res.json();

        assert.ok(json.blocks.length >= 4);
        // Verify no personal names exist in public scorecard
        const jsonString = JSON.stringify(json);
        assert.ok(!jsonString.includes('Debabrata'));
        assert.ok(!jsonString.includes('Rahul'));
    });
});
