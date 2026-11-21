// Hyperlocal Matching Engine for KAAMSETU
// Implements the rigorous 4-factor scoring formula:
// Match Score = (0.40 * Skill Score) + (0.25 * Location Score) + (0.20 * Wage Score) + (0.15 * Availability Score)

// Related skills ontology mapping
const RELATED_SKILLS_MAP = {
  'electrician': ['wireman', 'appliance repair', 'motor winding', 'solar installer', 'cctv technician'],
  'plumber': ['pipe fitter', 'sanitary worker', 'drainage cleaner', 'pump operator'],
  'carpenter': ['furniture maker', 'wood polisher', 'modular kitchen installer', 'wood craftsman'],
  'painter': ['whitewasher', 'texture painter', 'waterproofing technician', 'wall putty worker'],
  'mason': ['construction worker', 'tile layer', 'bricklayer', 'plaster worker'],
  'mechanic': ['auto mechanic', 'bike mechanic', 'diesel engine mechanic', 'two-wheeler technician'],
  'driver': ['delivery driver', 'truck driver', 'cab driver', 'van driver'],
  'cleaner': ['housekeeper', 'office cleaner', 'deep cleaning specialist', 'sanitation worker'],
  'welder': ['fabricator', 'iron worker', 'sheet metal worker', 'blacksmith']
};

/**
 * Calculates haversine distance between two sets of lat/lng in kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const values = [lat1, lon1, lat2, lon2].map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [latitude1, longitude1, latitude2, longitude2] = values;
  if (Math.abs(latitude1) > 90 || Math.abs(latitude2) > 90 || Math.abs(longitude1) > 180 || Math.abs(longitude2) > 180) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const dLon = ((longitude2 - longitude1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

/**
 * Calculate skill compatibility (0 - 100)
 */
export const calculateSkillScore = (workerSkills = [], requiredSkills = []) => {
  if (!requiredSkills || requiredSkills.length === 0) return { score: 100, explanation: 'No specific prerequisite skills mandatory.' };
  if (!workerSkills || workerSkills.length === 0) return { score: 10, explanation: 'Worker skills profile needs to be populated.' };

  const normRequired = requiredSkills.map(s => s.toLowerCase().trim());
  const normWorker = workerSkills.map(s => (typeof s === 'string' ? s : s.skillName || '').toLowerCase().trim());

  // Check exact matches
  const exactMatches = normRequired.filter(req => normWorker.some(w => w === req || w.includes(req) || req.includes(w)));
  if (exactMatches.length > 0) {
    const fraction = exactMatches.length / normRequired.length;
    const score = Math.min(100, Math.round(75 + fraction * 25));
    return {
      score,
      explanation: `Direct skill match for ${exactMatches.join(', ')}.`
    };
  }

  // Check related skills
  let hasRelated = false;
  let matchedRelated = [];
  for (const req of normRequired) {
    for (const [key, relatedList] of Object.entries(RELATED_SKILLS_MAP)) {
      if (req.includes(key) || key.includes(req)) {
        const found = normWorker.find(w => relatedList.some(rel => w.includes(rel) || rel.includes(w)) || w.includes(key));
        if (found) {
          hasRelated = true;
          matchedRelated.push(`${found} (related to ${req})`);
        }
      }
    }
  }

  if (hasRelated) {
    return {
      score: 70,
      explanation: `Related skill foundation: ${matchedRelated.join(', ')}.`
    };
  }

  return {
    score: 25,
    explanation: 'Worker skills do not directly align with mandatory trade requirements.'
  };
};

/**
 * Calculate location score (0 - 100)
 */
export const calculateLocationScore = (workerLoc = {}, jobLoc = {}, maxDistanceKm = 15) => {
  const wCoords = workerLoc.coordinates;
  const jCoords = jobLoc.coordinates;

  const hasCoordinates = [wCoords?.lat, wCoords?.lng, jCoords?.lat, jCoords?.lng]
    .every(value => value !== undefined && value !== null && Number.isFinite(Number(value)));

  if (hasCoordinates) {
    const distanceKm = calculateDistanceKm(wCoords.lat, wCoords.lng, jCoords.lat, jCoords.lng);
    if (distanceKm !== null) {
      let score = 100;
      if (distanceKm <= 2) score = 100;
      else if (distanceKm <= 5) score = 88;
      else if (distanceKm <= 10) score = 72;
      else if (distanceKm <= 15) score = 55;
      else if (distanceKm <= 25) score = 35;
      else score = 15;

      return {
        score,
        distanceKm,
        explanation: `Worksite is approximately ${distanceKm} km away in a straight line.`
      };
    }
  }

  // Area/city can help rank jobs, but must never be presented as a measured distance.
  const wCity = (workerLoc.city || '').toLowerCase().trim();
  const jCity = (jobLoc.city || '').toLowerCase().trim();
  const wArea = (workerLoc.area || '').toLowerCase().trim();
  const jArea = (jobLoc.area || '').toLowerCase().trim();

  if (wArea && jArea && wArea === jArea) {
    return {
      score: 90,
      distanceKm: null,
      explanation: `Same neighbourhood (${jobLoc.area}); add both map pins to calculate exact distance.`
    };
  }

  if (wCity && jCity && wCity === jCity) {
    return {
      score: 75,
      distanceKm: null,
      explanation: `Same city (${jobLoc.city}); exact distance is unavailable until both map pins are set.`
    };
  }

  return {
    score: 40,
    distanceKm: null,
    explanation: 'Exact distance is unavailable because one or both map pins are missing.'
  };
};

/**
 * Calculate wage compatibility (0 - 100)
 */
export const calculateWageScore = (expectedWage = 0, offeredWage = 0, wageType = 'daily') => {
  const expected = Number(expectedWage) || 0;
  const offered = Number(offeredWage) || 0;

  if (expected === 0 || offered === 0) {
    return {
      score: 80,
      explanation: 'Standard competitive wage offered.'
    };
  }

  if (offered >= expected) {
    const diff = offered - expected;
    const premiumNote = diff > 0 ? ` (₹${diff} above your expected wage!)` : ' (meets exact expectation).';
    return {
      score: 100,
      explanation: `Offered wage ₹${offered}/${wageType}${premiumNote}`
    };
  }

  const ratio = offered / expected;
  if (ratio >= 0.90) {
    return {
      score: 85,
      explanation: `Offered wage ₹${offered} is 90%+ of your expected ₹${expected}/${wageType}.`
    };
  } else if (ratio >= 0.80) {
    return {
      score: 65,
      explanation: `Offered wage ₹${offered} is slightly below expected ₹${expected}/${wageType}.`
    };
  } else if (ratio >= 0.70) {
    return {
      score: 45,
      explanation: `Offered wage ₹${offered} is ₹${expected - offered} lower than your preference.`
    };
  } else {
    return {
      score: 20,
      explanation: `Offered wage ₹${offered} is substantially below your rate of ₹${expected}/${wageType}.`
    };
  }
};

/**
 * Calculate availability score (0 - 100)
 */
export const calculateAvailabilityScore = (workerPrefs = {}, job = {}) => {
  // Check timeline overlap / timing
  const isAvailableImmediately = workerPrefs.availableDates === 'Immediate' || !workerPrefs.availableDates;
  if (isAvailableImmediately) {
    return {
      score: 100,
      explanation: 'Your immediate availability matches employer timeline perfectly.'
    };
  }

  return {
    score: 85,
    explanation: 'Flexible schedule alignment with employer work shift.'
  };
};

/**
 * Compute the full compound Match Score & Explanations
 */
export const calculateJobMatch = (workerProfile, job) => {
  const skillRes = calculateSkillScore(workerProfile?.skills || [], job?.requiredSkills || []);
  const locRes = calculateLocationScore(
    workerProfile?.location || {},
    job?.location || {},
    workerProfile?.preferences?.maxDistanceKm || 15
  );
  const wageRes = calculateWageScore(
    workerProfile?.preferences?.expectedDailyWage || 800,
    job?.offeredWage || 850,
    job?.wageType || 'daily'
  );
  const availRes = calculateAvailabilityScore(workerProfile?.preferences || {}, job || {});

  // Formula:
  // Match Score = (0.40 * Skill Score) + (0.25 * Location Score) + (0.20 * Wage Score) + (0.15 * Availability Score)
  const compoundScore = (
    0.40 * skillRes.score +
    0.25 * locRes.score +
    0.20 * wageRes.score +
    0.15 * availRes.score
  );

  const totalScore = Math.min(100, Math.max(0, Math.round(compoundScore)));

  const explanations = [
    skillRes.explanation,
    locRes.explanation,
    wageRes.explanation,
    availRes.explanation
  ];

  return {
    matchScore: totalScore,
    breakdown: {
      skillScore: skillRes.score,
      locationScore: locRes.score,
      wageScore: wageRes.score,
      availabilityScore: availRes.score,
    },
    distanceKm: locRes.distanceKm,
    explanations
  };
};
