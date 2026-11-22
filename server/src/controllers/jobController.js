import { find, findOne, insert, update, remove } from '../services/storage.js';
import { calculateJobMatch } from '../services/matchingEngine.js';

export const getJobs = async (req, res) => {
  try {
    const { category, search, city, area, wageType, minWage, maxWage } = req.query;
    const normalize = value => String(value || '').toLowerCase().trim();
    const originalJobs = find('jobs', job => job.status === 'active');
    let jobs = [...originalJobs];
    const searchMeta = { searchMatched: true, categoryMatched: true, areaMatched: true, wageMatched: true };

    // Treat spoken/typed preferences as ranking hints when an exact match is
    // unavailable. Never turn "near me" into a literal area requirement.
    const genericNearby = /^(nearby|near me|around me|aas paas|mere aas paas|पास में|आस पास)$/i.test(normalize(area));
    if (search) {
      const stopWords = new Set(['near', 'me', 'nearby', 'around', 'the', 'in', 'at', 'for', 'job', 'jobs', 'work', 'kaam', 'chahiye', 'mujhe', 'kal', 'today', 'tomorrow', 'aas', 'paas']);
      const terms = normalize(search).split(/\s+/).filter(term => term.length > 1 && !stopWords.has(term));
      if (terms.length) {
        const matched = jobs.filter(job => {
          const searchable = [
            job.title, job.description, job.companyName, job.category,
            job.location?.area, job.location?.city, ...(job.requiredSkills || [])
          ].map(normalize).join(' ');
          return terms.some(term => searchable.includes(term));
        });
        searchMeta.searchMatched = matched.length > 0;
        if (matched.length) jobs = matched;
      }
    }

    if (category && category !== 'All') {
      const term = normalize(category);
      const matched = jobs.filter(job =>
        normalize(job.category).includes(term) ||
        (job.requiredSkills || []).some(skill => normalize(skill).includes(term))
      );
      searchMeta.categoryMatched = matched.length > 0;
      if (matched.length) jobs = matched;
    }

    if (city) {
      const matched = jobs.filter(job => normalize(job.location?.city) === normalize(city));
      if (matched.length) jobs = matched;
    }

    if (area && !genericNearby) {
      const term = normalize(area);
      const matched = jobs.filter(job =>
        normalize(job.location?.area).includes(term) ||
        normalize(job.location?.city).includes(term)
      );
      searchMeta.areaMatched = matched.length > 0;
      if (matched.length) jobs = matched;
    }

    if (wageType) {
      const matched = jobs.filter(job => normalize(job.wageType) === normalize(wageType));
      if (matched.length) jobs = matched;
      else searchMeta.wageMatched = false;
    }

    if (minWage) {
      const matched = jobs.filter(job => Number(job.offeredWage) >= Number(minWage));
      if (matched.length) jobs = matched;
      else searchMeta.wageMatched = false;
    }
    if (maxWage) {
      const matched = jobs.filter(job => Number(job.offeredWage) <= Number(maxWage));
      if (matched.length) jobs = matched;
      else searchMeta.wageMatched = false;
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      searchMeta,
      jobs: jobs.map(({ employerContact, ...publicJob }) => publicJob)
    });
  } catch (error) {
    console.error('getJobs error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving job listings.' });
  }
};
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = findOne('jobs', j => j._id === id || j.id === id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Public job details do not reveal private employer contact information.
    const employerProfile = findOne('employerProfiles', ep => ep.userId === job.employerId || ep._id === job.employerProfileId);
    const publicEmployerProfile = employerProfile ? {
      ...employerProfile,
      phone: undefined,
      email: undefined,
      address: { ...employerProfile.address, coordinates: undefined }
    } : null;

    res.status(200).json({
      success: true,
      job: (({ employerContact, ...publicJob }) => publicJob)(job),
      employerProfile: publicEmployerProfile
    });
  } catch (error) {
    console.error('getJobById error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job details.' });
  }
};

export const getMatchingJobsForWorker = async (req, res) => {
  try {
    const workerUserId = req.user._id || req.user.id;
    const workerProfile = findOne('workerProfiles', wp => wp.userId === workerUserId);

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found. Please complete profile.' });
    }

    const { skill, search, location, expected_wage, expected_wage_type, max_distance } = req.query;
    const requestedWage = Number(expected_wage);
    const hasRequestedWage = expected_wage !== undefined && Number.isFinite(requestedWage) && requestedWage > 0;
    const requestedDistance = Number(max_distance);
    const hasRequestedDistance = max_distance !== undefined && Number.isFinite(requestedDistance) && requestedDistance > 0;
    const normalize = value => String(value || '').toLowerCase().trim();
    const requestedSkill = normalize(skill);
    const searchTerms = normalize(search).split(/\\s+/).filter(Boolean);

    const effectiveProfile = {
      ...workerProfile,
      skills: skill
        ? [{ skillName: String(skill).trim(), category: 'Voice search' }, ...(workerProfile.skills || [])]
        : workerProfile.skills,
      preferences: {
        ...workerProfile.preferences,
        expectedDailyWage: hasRequestedWage && expected_wage_type !== 'monthly' ? requestedWage : workerProfile.preferences?.expectedDailyWage,
        expectedMonthlyWage: hasRequestedWage && expected_wage_type === 'monthly' ? requestedWage : workerProfile.preferences?.expectedMonthlyWage,
        maxDistanceKm: hasRequestedDistance ? Math.min(100, Math.max(1, requestedDistance)) : workerProfile.preferences?.maxDistanceKm
      }
    };

    let activeJobs = find('jobs', job => job.status === 'active');

    // Apply text search to the same fields used by public job discovery.
    if (searchTerms.length && !requestedSkill) {
      activeJobs = activeJobs.filter(job => {
        const searchableText = [
          job.title, job.description, job.companyName, job.category,
          job.location?.area, job.location?.city, ...(job.requiredSkills || [])
        ].map(normalize).join(' ');
        return searchTerms.some(term => searchableText.includes(term));
      });
    }

    // Prefer the requested area/city. If there are no exact area results, keep
    // other active jobs visible rather than showing an empty dashboard.
    const requestedLocation = normalize(location);
    let locationMatched = true;
    if (requestedLocation && requestedLocation !== 'nearby') {
      const locationJobs = activeJobs.filter(job => {
        const area = normalize(job.location?.area);
        const city = normalize(job.location?.city);
        return area.includes(requestedLocation) || city.includes(requestedLocation);
      });
      if (locationJobs.length) {
        activeJobs = locationJobs;
      } else {
        locationMatched = false;
      }
    }

    const existingApplications = find('applications', application => application.workerId === workerUserId);
    const appliedJobIds = new Set(existingApplications.map(application => application.jobId));
    const configuredWorkerRadius = Number(effectiveProfile.preferences?.maxDistanceKm);
    const workerRadius = Number.isFinite(configuredWorkerRadius) && configuredWorkerRadius > 0
      ? configuredWorkerRadius
      : 10;

    const scoredJobs = activeJobs.map(job => {
      const matchResult = calculateJobMatch(effectiveProfile, job);
      const employerUser = findOne('users', user => user._id === job.employerId || user.id === job.employerId);
      const employerProfile = findOne('employerProfiles', profile => profile.userId === job.employerId);
      const employerRadiusValue = Number(job.hiringRadiusKm);
      const employerRadius = Number.isFinite(employerRadiusValue) && employerRadiusValue > 0 ? employerRadiusValue : 10;
      const hasMeasuredDistance = Number.isFinite(matchResult.distanceKm);
      const withinWorkerRadius = !hasMeasuredDistance || matchResult.distanceKm <= workerRadius;
      const withinEmployerRadius = !hasMeasuredDistance || matchResult.distanceKm <= employerRadius;
      const searchableText = [
        job.title, job.description, job.companyName, job.category,
        job.location?.area, job.location?.city, ...(job.requiredSkills || [])
      ].map(normalize).join(' ');
      const textRelevance = searchTerms.length && !requestedSkill
        ? searchTerms.filter(term => searchableText.includes(term)).length
        : 0;

      return {
        ...job,
        employerContact: undefined,
        employerVerificationStatus: employerUser?.verificationStatus || 'Registered',
        employerRating: employerProfile?.rating !== undefined && employerProfile?.rating !== null && Number.isFinite(Number(employerProfile.rating)) ? Number(employerProfile.rating) : null,
        matchScore: matchResult.matchScore,
        matchBreakdown: matchResult.breakdown,
        distanceKm: matchResult.distanceKm,
        matchExplanations: matchResult.explanations,
        withinPreferredDistance: withinWorkerRadius && withinEmployerRadius,
        withinWorkerRadius,
        withinEmployerRadius,
        hasApplied: appliedJobIds.has(job._id || job.id),
        applicationStatus: existingApplications.find(application => application.jobId === (job._id || job.id))?.status || null,
        _searchRelevance: textRelevance
      };
    });

    // Keep suitable jobs discoverable; rank jobs inside both preferred radii first.
    // Missing map pins never create a fake distance or hide a job.
    scoredJobs.sort((a, b) => {
      const aPreferred = a.withinPreferredDistance ? 1 : 0;
      const bPreferred = b.withinPreferredDistance ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
      if (b._searchRelevance !== a._searchRelevance) return b._searchRelevance - a._searchRelevance;
      return b.matchScore - a.matchScore;
    });

    const jobs = scoredJobs.map(({ _searchRelevance, ...job }) => job);
    res.status(200).json({
      success: true,
      count: jobs.length,
      workerLocation: workerProfile.location,
      locationMatched,
      jobs
    });
  } catch (error) {
    console.error('getMatchingJobsForWorker error:', error);
    res.status(500).json({ success: false, message: 'Error calculating job matches.' });
  }
};

export const createJob = async (req, res) => {
  try {
    const employerUserId = req.user._id || req.user.id;
    const employerProfile = findOne('employerProfiles', ep => ep.userId === employerUserId);

    const {
      title,
      category,
      requiredSkills,
      description,
      requiredExperience,
      vacancies,
      offeredWage,
      wageType,
      workDuration,
      paymentFrequency,
      paymentTerms,
      deductions,
      overtimeTerms,
      location,
      startDate,
      workTimings,
      employerContact,
      hiringRadiusKm
    } = req.body;

    if (!title || !offeredWage || !description) {
      return res.status(400).json({ success: false, message: 'Please provide job title, description, and offered wage.' });
    }
    const pin = location?.coordinates;
    const validPin = location?.pinConfirmed === true && Number.isFinite(Number(pin?.lat)) && Number.isFinite(Number(pin?.lng)) && Math.abs(Number(pin.lat)) <= 90 && Math.abs(Number(pin.lng)) <= 180;
    if (!validPin) return res.status(400).json({ success: false, message: 'Confirm the actual worksite map pin using GPS or valid coordinates before publishing.' });

    // Fair Wage Transparency automated checks
    const wageWarnings = [];
    if (offeredWage < 600 && wageType === 'daily') {
      wageWarnings.push("Offered wage is below KaamSetu's illustrative daily-wage reference (₹600); this is not a statutory minimum.");
    }
    if (!paymentTerms || paymentTerms.trim().length < 5) {
      wageWarnings.push('Payment terms are not transparently specified.');
    }
    if (!paymentFrequency) {
      wageWarnings.push('Disbursement timeline / payment frequency is missing.');
    }

    const newJob = insert('jobs', {
      employerId: employerUserId,
      employerProfileId: employerProfile?._id,
      companyName: employerProfile?.companyName || req.user.name,
      title,
      category: category || (Array.isArray(requiredSkills) ? requiredSkills[0] : 'General'),
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills || 'General'],
      description,
      requiredExperience: requiredExperience || '1–3 years',
      vacancies: Number(vacancies) || 1,
      filledVacancies: 0,
      offeredWage: Number(offeredWage),
      wageType: wageType || 'daily',
      workDuration: workDuration || '3 Days',
      paymentFrequency: paymentFrequency || 'Daily at shift end',
      paymentTerms: paymentTerms || 'Direct UPI / Cash payment upon shift completion',
      deductions: deductions || 'None. 100% agreed wage.',
      overtimeTerms: overtimeTerms || '₹120/hr overtime.',
      wageTransparencyWarnings: wageWarnings,
      hiringRadiusKm: Math.min(100, Math.max(1, Number(hiringRadiusKm ?? employerProfile?.maxHiringDistanceKm ?? 10))),
      location: { ...location, coordinates: { lat: Number(pin.lat), lng: Number(pin.lng) }, pinConfirmed: true },
      startDate: startDate || new Date(Date.now() + 86400000).toISOString(),
      workTimings: workTimings || '9:00 AM - 6:00 PM',
      employerContact: employerContact || {
        phone: req.user.phone,
        personName: employerProfile?.contactPerson || req.user.name
      },
      status: 'active',
      applicantsCount: 0,
      shortlistedCount: 0,
      isReported: false,
      reportCount: 0
    });

    // Update employer stats
    if (employerProfile) {
      update('employerProfiles', employerProfile._id, {
        jobsPostedCount: (employerProfile.jobsPostedCount || 0) + 1,
        activeJobsCount: (employerProfile.activeJobsCount || 0) + 1
      });
    }

    res.status(201).json({
      success: true,
      message: 'Job listing published successfully with Fair Wage transparency!',
      job: newJob
    });
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({ success: false, message: 'Error posting job.' });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = findOne('jobs', j => j._id === id || j.id === id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.employerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this job.' });
    }

    const editableFields = [
      'title', 'category', 'requiredSkills', 'description', 'requiredExperience',
      'vacancies', 'offeredWage', 'wageType', 'workDuration', 'paymentFrequency',
      'paymentTerms', 'deductions', 'overtimeTerms', 'location', 'startDate',
      'workTimings', 'hiringRadiusKm'
    ];
    const safeUpdates = Object.fromEntries(
      editableFields.filter(field => req.body?.[field] !== undefined).map(field => [field, req.body[field]])
    );
    if (safeUpdates.location !== undefined) {
      const pin = safeUpdates.location?.coordinates;
      const validPin = safeUpdates.location?.pinConfirmed === true && Number.isFinite(Number(pin?.lat)) && Number.isFinite(Number(pin?.lng)) && Math.abs(Number(pin.lat)) <= 90 && Math.abs(Number(pin.lng)) <= 180;
      if (!validPin) return res.status(400).json({ success: false, message: 'Confirm the actual worksite map pin before saving the location.' });
      safeUpdates.location = { ...safeUpdates.location, coordinates: { lat: Number(pin.lat), lng: Number(pin.lng) }, pinConfirmed: true };
    }
    if (safeUpdates.offeredWage !== undefined && (!Number.isFinite(Number(safeUpdates.offeredWage)) || Number(safeUpdates.offeredWage) <= 0)) {
      return res.status(400).json({ success: false, message: 'Enter a valid positive wage.' });
    }
    if (safeUpdates.hiringRadiusKm !== undefined) {
      safeUpdates.hiringRadiusKm = Math.min(100, Math.max(1, Number(safeUpdates.hiringRadiusKm) || 10));
    }
    const updatedJob = update('jobs', id, safeUpdates);
    res.status(200).json({ success: true, message: 'Job updated successfully.', job: updatedJob });
  } catch (error) {
    console.error('updateJob error:', error);
    res.status(500).json({ success: false, message: 'Error updating job.' });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = findOne('jobs', j => j._id === id || j.id === id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.employerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this job.' });
    }

    remove('jobs', id);
    res.status(200).json({ success: true, message: 'Job removed successfully.' });
  } catch (error) {
    console.error('deleteJob error:', error);
    res.status(500).json({ success: false, message: 'Error deleting job.' });
  }
};
