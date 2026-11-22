import { findOne, insert } from '../services/storage.js';

export const createReport = async (req, res) => {
  try {
    const reporterUserId = req.user._id || req.user.id;
    const { targetType, targetId, targetName, reason, details } = req.body;

    const allowedTypes = ['job', 'worker', 'employer', 'payment'];
    const allowedReasons = ['Fake listing', 'Unsafe behaviour', 'Harassment', 'Payment issue', 'Misleading information', 'Non-payment', 'Unsafe conduct', 'Cancellation dispute', 'Other'];
    if (!allowedTypes.includes(targetType) || !targetId || !allowedReasons.includes(reason) || !details || String(details).trim().length < 5 || String(details).length > 1500) {
      return res.status(400).json({ success: false, message: 'Please provide all report details.' });
    }

    const collection = targetType === 'job' ? 'jobs' : targetType === 'worker' ? 'workerProfiles' : targetType === 'employer' ? 'employerProfiles' : 'payments';
    const target = findOne(collection, item => (item._id || item.id) === targetId || (targetType === 'worker' || targetType === 'employer') && item.userId === targetId);
    if (!target) return res.status(404).json({ success: false, message: 'The item you are reporting could not be found.' });

    const report = insert('reports', {
      reportedBy: reporterUserId,
      targetType,
      targetId,
      targetName: targetName || 'Target Listing / Account',
      reason,
      details: String(details).trim(),
      status: 'Pending',
      actionTaken: 'Awaiting admin review',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted for administrative review. KAAMSETU takes safety seriously.',
      report
    });
  } catch (error) {
    console.error('createReport error:', error);
    res.status(500).json({ success: false, message: 'Error submitting report.' });
  }
};
