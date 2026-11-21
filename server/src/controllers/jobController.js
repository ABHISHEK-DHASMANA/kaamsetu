import { find, findOne, insert, update, remove } from '../services/storage.js';
import { calculateJobMatch } from '../services/matchingEngine.js';

export const getJobs = async (req, res) => {
  try {
    const { category, search, city, area, wageType, minWage, maxWage } = req.query;
    let jobs = find('jobs', j => j.status === 'active');

    if (category && category !== 'All') {
      jobs = jobs.filter(j => 
        (j.category && j.category.toLowerCase() === category.toLowerCase()) ||
        (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(category.toLowerCase())))
      );
    }

    if (city) {
      jobs = jobs.filter(j => j.location?.city?.toLowerCase() === city.toLowerCase());
    }

    if (area) {
      jobs = jobs.filter(j => j.location?.area?.toLowerCase().includes(area.toLowerCase()));
    }

    if (wageType) {
      jobs = jobs.filter(j => j.wageType === wageType);
    }

    if (minWage) {
      jobs = jobs.filter(j => j.offeredWage >= Number(minWage));
    }

    if (maxWage) {
      jobs = jobs.filter(j => j.offeredWage <= Number(maxWage));
    }

    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j => 
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.location?.area?.toLowerCase().includes(q) ||
        j.requiredSkills?.some(s => s.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
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

    // Employer details
    const employerProfile = findOne('employerProfiles', ep => ep.userId === job.employerId || ep._id === job.employerProfileId);

    res.status(200).json({
      success: true,
      job,
      employerProfile
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

    // Optional query overrides (e.g. from Voice-to-Work extraction!)
    const { skill, location, expected_wage, max_distance } = req.query;
    
    // Construct effective worker preferences (merging profile and voice overrides)
    const effectiveProfile = {
      ...workerProfile,
      skills: skill ? [{ skillName: skill, category: 'Extracted' }, ...(workerProfile.skills || [])] : workerProfile.skills,
      preferences: {
        ...workerProfile.preferences,
        expectedDailyWage: expected_wage ? Number(expected_wage) : workerProfile.preferences?.expectedDailyWage,
        maxDistanceKm: max_distance ? Number(max_distance) : workerProfile.preferences?.maxDistanceKm
      }
    };

    if (location && location !== 'Nearby') {
      effectiveProfile.location = {
        ...effectiveProfile.location,
        area: location
      };
    }

    const activeJobs = find('jobs', j => j.status === 'active');
    
    // Check which jobs worker already applied to
    const existingApplications = find('applications', a => a.workerId === workerUserId);
    const appliedJobIds = new Set(existingApplications.map(a => a.jobId));

    const workerRadius = Number(effectiveProfile.preferences?.maxDistanceKm || 10);
    const scoredJobs = activeJobs.map(job => {
      const matchResult = calculateJobMatch(effectiveProfile, job);
      return {
        ...job,
        matchScore: matchResult.matchScore,
        matchBreakdown: matchResult.breakdown,
        distanceKm: matchResult.distanceKm,
        matchExplanations: matchResult.explanations,
        hasApplied: appliedJobIds.has(job._id || job.id),
        applicationStatus: existingApplications.find(a => a.jobId === (job._id || job.id))?.status || null
      };
    });

    // Respect both sides' distance preferences. Distances are straight-line estimates from saved map coordinates.
    const withinBothDistancePreferences = scoredJobs.filter(job => {
      if (job.distanceKm === null || job.distanceKm === undefined) return true;
      const employerRadius = Number(job.hiringRadiusKm || 10);
      return job.distanceKm <= workerRadius && job.distanceKm <= employerRadius;
    });

    // Sort by match score descending
    withinBothDistancePreferences.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      count: withinBothDistancePreferences.length,
      workerLocation: workerProfile.location,
      jobs: withinBothDistancePreferences
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

    // Fair Wage Transparency automated checks
    const wageWarnings = [];
    if (offeredWage < 600 && wageType === 'daily') {
      wageWarnings.push('Offered wage is below standard daily living guideline (₹600).');
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
      location: location || employerProfile?.address || {
        address: 'Sector 63',
        area: 'Sector 63',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.6271, lng: 77.3820 }
      },
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

    const updatedJob = update('jobs', id, req.body);
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
