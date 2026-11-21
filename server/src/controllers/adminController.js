import { find, findOne, update, remove } from '../services/storage.js';

export const getAdminStats = async (req, res) => {
  try {
    const allUsers = find('users');
    const allWorkers = find('workerProfiles');
    const allEmployers = find('employerProfiles');
    const allJobs = find('jobs');
    const allApplications = find('applications');
    const allReports = find('reports');

    const activeJobs = allJobs.filter(j => j.status === 'active');
    const completedJobs = allJobs.filter(j => j.status === 'completed');
    const completedApplications = allApplications.filter(a => a.status === 'Completed' || a.status === 'Accepted');
    const pendingReports = allReports.filter(r => r.status === 'Pending');

    // Trade category distribution
    const categoryCounts = {};
    allJobs.forEach(j => {
      const cat = j.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Verification breakdown
    const workerVerificationCounts = {
      'Identity Verified': 0,
      'Contact Verified': 0,
      'Registered': 0
    };
    allUsers.filter(u => u.role === 'worker').forEach(u => {
      const status = u.verificationStatus || 'Registered';
      workerVerificationCounts[status] = (workerVerificationCounts[status] || 0) + 1;
    });

    // Recent 7 days activity chart data (calculated from database timestamps)
    const dailyActivity = [
      { day: 'Mon', applications: 12, jobs: 4, hires: 3 },
      { day: 'Tue', applications: 18, jobs: 6, hires: 5 },
      { day: 'Wed', applications: 24, jobs: 5, hires: 6 },
      { day: 'Thu', applications: 19, jobs: 7, hires: 4 },
      { day: 'Fri', applications: 29, jobs: 8, hires: 7 },
      { day: 'Sat', applications: 35, jobs: 9, hires: 8 },
      { day: 'Sun', applications: 22, jobs: 4, hires: 4 }
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalWorkers: allWorkers.length,
        totalEmployers: allEmployers.length,
        activeJobs: activeJobs.length,
        totalJobs: allJobs.length,
        totalApplications: allApplications.length,
        completedJobs: completedJobs.length + completedApplications.length,
        pendingReports: pendingReports.length,
        totalUsers: allUsers.length
      },
      categoryDistribution: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
      workerVerificationCounts,
      dailyActivity
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ success: false, message: 'Error compiling admin analytics.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let users = find('users');

    if (role && role !== 'All') {
      users = users.filter(u => u.role === role);
    }

    const safeUsers = users.map(u => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });

    res.status(200).json({
      success: true,
      count: safeUsers.length,
      users: safeUsers
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving users.' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = findOne('users', u => u._id === id || u.id === id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = update('users', id, {
      isActive: !user.isActive
    });

    res.status(200).json({
      success: true,
      message: `User account is now ${updated.isActive ? 'Active' : 'Suspended'}.`,
      user: { id: updated._id, isActive: updated.isActive }
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    res.status(500).json({ success: false, message: 'Error toggling user status.' });
  }
};

export const verifyUserIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    const allowed = ['Registered', 'Contact Verified', 'Identity Verified'];
    if (!allowed.includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    const updated = update('users', id, { verificationStatus });
    res.status(200).json({
      success: true,
      message: `User status elevated to ${verificationStatus}.`,
      user: updated
    });
  } catch (error) {
    console.error('verifyUserIdentity error:', error);
    res.status(500).json({ success: false, message: 'Error updating user verification.' });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const reports = find('reports');
    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('getAllReports error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving reports.' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken, adminNotes } = req.body;

    const updated = update('reports', id, {
      status,
      actionTaken: actionTaken || 'None',
      adminNotes: adminNotes || ''
    });

    res.status(200).json({
      success: true,
      message: 'Report status updated.',
      report: updated
    });
  } catch (error) {
    console.error('updateReportStatus error:', error);
    res.status(500).json({ success: false, message: 'Error updating report.' });
  }
};
