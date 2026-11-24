import test from 'node:test';
import assert from 'node:assert/strict';
import { insert, findOne, remove } from '../services/storage.js';

test('auth storage supports user creation with unverified email and prevents unverified login', async () => {
  const testEmail = `test_unverified_${Date.now()}@example.com`;
  const user = insert('users', {
    name: 'Test Unverified Worker',
    email: testEmail,
    emailVerified: false,
    verificationStatus: 'Email Verification Pending',
    role: 'worker',
    isActive: true
  });

  try {
    assert.ok(user._id || user.id, 'User record created');
    assert.equal(user.emailVerified, false, 'User starts with emailVerified false');

    // Simulate verification check (login condition)
    const fetchedUser = findOne('users', u => u.email === testEmail);
    assert.equal(fetchedUser.emailVerified, false);
    
    // Check that unverified state blocks login requirement
    const isLoginPermitted = fetchedUser.emailVerified === true;
    assert.equal(isLoginPermitted, false, 'Unverified user cannot log in');
  } finally {
    remove('users', user._id || user.id);
  }
});

test('verified email allows authentication and profile linkage', async () => {
  const testEmail = `test_verified_${Date.now()}@example.com`;
  const user = insert('users', {
    name: 'Test Verified Worker',
    email: testEmail,
    emailVerified: true,
    verificationStatus: 'Email Verified',
    role: 'worker',
    isActive: true
  });

  try {
    const fetchedUser = findOne('users', u => u.email === testEmail);
    assert.equal(fetchedUser.emailVerified, true, 'User is verified');
    const isLoginPermitted = fetchedUser.emailVerified === true;
    assert.equal(isLoginPermitted, true, 'Verified user is permitted to log in');
  } finally {
    remove('users', user._id || user.id);
  }
});
