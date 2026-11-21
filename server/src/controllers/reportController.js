import { insert } from '../services/storage.js';

export const createReport = async (req, res) => {
  try {
    const reporterUserId = req.user._id || req.user.id;
    const { targetType, targetId, targetName, reason, details } = req.body;

    if (!targetType || !targetId || !reason || !details) {
      return res.status(400).json({ success: false, message: 'Please provide all report details.' });
    }

    const report = insert('reports', {
      reportedBy: reporterUserId,
      targetType,
      targetId,
      targetName: targetName || 'Target Listing / Account',
      reason,
      details,
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
