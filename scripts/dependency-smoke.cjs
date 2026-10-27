const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { load } = require('sqlite-vec');
const db = new Database(':memory:');
try {
  assert.equal(db.prepare('SELECT 1 AS ok').get().ok, 1);
  db.exec('CREATE VIRTUAL TABLE texts USING fts5(body)');
  db.prepare('INSERT INTO texts(body) VALUES (?)').run('United Nations peace');
  assert.equal(db.prepare("SELECT count(*) AS total FROM texts WHERE texts MATCH 'peace'").get().total, 1);
  load(db);
  assert.match(db.prepare('SELECT vec_version() AS version').get().version, /^v?0\./);
  assert.equal(db.prepare("SELECT vec_distance_L2('[1,2]', '[1,2]') AS distance").get().distance, 0);
  console.log('Native SQLite, FTS5 and sqlite-vec checks passed (in-memory database only).');
} finally { db.close(); }
