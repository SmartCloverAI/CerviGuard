import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAccessCase,
  filterCasesForUser,
} from '../src/lib/auth/case-access.ts';
import {
  DEMO_SESSION_SECRET,
  resolveSessionSecret,
} from '../src/lib/constants/session.ts';

const cases = [
  { id: 'case-a', username: 'clinician-a' },
  { id: 'case-b', username: 'clinician-b' },
];

test('clinicians can access only their own cases', () => {
  const user = { username: 'clinician-a', role: 'user' };

  assert.equal(canAccessCase(user, cases[0]), true);
  assert.equal(canAccessCase(user, cases[1]), false);
  assert.deepEqual(filterCasesForUser(user, cases), [cases[0]]);
});

test('administrators can access every case', () => {
  const admin = { username: 'admin', role: 'admin' };

  assert.equal(canAccessCase(admin, cases[0]), true);
  assert.equal(canAccessCase(admin, cases[1]), true);
  assert.deepEqual(filterCasesForUser(admin, cases), cases);
});

test('case ownership requires an exact username match', () => {
  const user = { username: 'clinician', role: 'user' };

  assert.equal(canAccessCase(user, { username: 'clinician-a' }), false);
});

test('production requires a strong server-only session secret', () => {
  assert.throws(() => resolveSessionSecret({}, true), /server-only session secret/);
  assert.throws(
    () => resolveSessionSecret({ NEXT_PUBLIC_SESSION_SECRET: 'x'.repeat(64) }, true),
    /server-only session secret/,
  );
  assert.throws(
    () => resolveSessionSecret({ SESSION_SECRET: 'short-secret' }, true),
    /server-only session secret/,
  );
  assert.equal(resolveSessionSecret({ SESSION_SECRET: 'x'.repeat(64) }, true), 'x'.repeat(64));
});

test('development retains an explicit demo-only fallback', () => {
  assert.equal(resolveSessionSecret({}, false), DEMO_SESSION_SECRET);
});
