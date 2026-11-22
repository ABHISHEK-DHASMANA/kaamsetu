import { find, findOne, insert, update } from '../services/storage.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifs = find('notifications', n => n.userId === userId);
    notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = notifs.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications: notifs
    });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving notifications.' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user._id || req.user.id);
    const notification = findOne('notifications', n => String(n._id || n.id) === String(id) && String(n.userId) === userId);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    const updated = update('notifications', id, { isRead: true });
    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Error marking notification read.' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifs = find('notifications', n => n.userId === userId && !n.isRead);
    notifs.forEach(n => {
      update('notifications', n._id, { isRead: true });
    });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ success: false, message: 'Error updating notifications.' });
  }
};
