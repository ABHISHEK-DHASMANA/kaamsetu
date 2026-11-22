import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDatabaseRecords } from './storage.js';

test('assigns unique IDs to seed records without IDs', () => {
  const db = normalizeDatabaseRecords({
    skills: [{ name: 'Electrician' }, { name: 'Plumber' }, { name: 'Carpenter' }]
  });
  const ids = db.skills.map((item) => item._id);
  assert.equal(new Set(ids).size, 3);
  assert.ok(ids.every(Boolean));
  assert.deepEqual(db.skills.map((item) => item.name), ['Electrician', 'Plumber', 'Carpenter']);
});

test('keeps existing IDs and resolves duplicate IDs without collisions', () => {
  const db = normalizeDatabaseRecords({
    users: [{ _id: 'user-1', name: 'A' }, { _id: 'user-1', name: 'B' }, { id: 'user-3', name: 'C' }]
  });
  const ids = db.users.map((item) => item._id || item.id);
  assert.equal(new Set(ids).size, 3);
  assert.equal(db.users[0]._id, 'user-1');
  assert.equal(db.users[2].id, 'user-3');
});

test('normalizes malformed collection values to empty arrays', () => {
  const db = normalizeDatabaseRecords({ skills: null, jobs: 'invalid' });
  assert.deepEqual(db.skills, []);
  assert.deepEqual(db.jobs, []);
});
