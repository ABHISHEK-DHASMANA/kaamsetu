import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  calculateLocationScore,
  calculateSkillScore,
  calculateWageScore,
  calculateJobMatch
} from './matchingEngine.js';

test('calculates a straight-line distance between known coordinates', () => {
  const distance = calculateDistanceKm(28.6280, 77.3649, 28.6271, 77.3820);
  assert.ok(distance > 1.5 && distance < 2.0);
});

test('returns null instead of inventing a distance when coordinates are missing', () => {
  assert.equal(calculateDistanceKm(undefined, 77.3, 28.6, 77.4), null);
  const result = calculateLocationScore(
    { city: 'Noida', area: 'Sector 62' },
    { city: 'Noida', area: 'Sector 62' }
  );
  assert.equal(result.distanceKm, null);
  assert.match(result.explanation, /add both map pins/i);
});

test('uses area and city only for ranking when map pins are unavailable', () => {
  const sameCity = calculateLocationScore(
    { city: 'Noida', area: 'Sector 62' },
    { city: 'Noida', area: 'Sector 63' }
  );
  assert.equal(sameCity.score, 75);
  assert.equal(sameCity.distanceKm, null);
});

test('matches related trade skills without treating them as exact matches', () => {
  const result = calculateSkillScore([{ skillName: 'Wireman' }], ['Electrician']);
  assert.equal(result.score, 70);
});

test('scores a monthly job against monthly worker wage preference', () => {
  const result = calculateJobMatch(
    {
      skills: [{ skillName: 'Electrician' }],
      location: { city: 'Noida', area: 'Sector 63', coordinates: { lat: 28.6271, lng: 77.3820 } },
      preferences: { expectedDailyWage: 800, expectedMonthlyWage: 22000, availableDates: 'Immediate', maxDistanceKm: 20 }
    },
    {
      requiredSkills: ['Electrician'],
      location: { city: 'Noida', area: 'Sector 63', coordinates: { lat: 28.6271, lng: 77.3820 } },
      offeredWage: 24000,
      wageType: 'monthly'
    }
  );
  assert.equal(result.breakdown.wageScore, 100);
});
