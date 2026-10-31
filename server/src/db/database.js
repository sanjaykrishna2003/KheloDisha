// Database Connection and Execution Layer using Node's built-in node:sqlite
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/khelodisha.db');
const dbDir = path.dirname(path.resolve(dbPath));

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(path.resolve(dbPath));

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Execute raw SQL string (can contain multiple statements)
 */
function exec(sql) {
    return db.exec(sql);
}

/**
 * Execute a query that returns all rows
 */
function query(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}

/**
 * Execute a query that returns a single row
 */
function get(sql, params = []) {
    const stmt = db.prepare(sql);
    const results = stmt.all(...params);
    return results.length > 0 ? results[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 * returns { changes, lastInsertRowid }
 */
function run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}

/**
 * Execute within a transaction
 */
function transaction(fn) {
    db.exec('BEGIN TRANSACTION;');
    try {
        const result = fn();
        db.exec('COMMIT;');
        return result;
    } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
    }
}

module.exports = {
    db,
    exec,
    query,
    get,
    run,
    transaction
};
