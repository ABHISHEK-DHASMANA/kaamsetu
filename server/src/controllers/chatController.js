import { find, findOne, insert } from '../services/storage.js';

const canAccess = (application, userId) => {
  if (!application || !['Accepted', 'Completed'].includes(application.status) ||
      (application.workerId !== userId && application.employerId !== userId)) return false;
  const otherId = application.workerId === userId ? application.employerId : application.workerId;
  return !findOne('userBlocks', b =>
    (b.blockerId === userId && b.blockedId === otherId) ||
    (b.blockerId === otherId && b.blockedId === userId)
  );
};

export const listChats = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const applications = find('applications', a => canAccess(a, userId));
  const chats = applications.map(application => {
    const job = findOne('jobs', j => j._id === application.jobId || j.id === application.jobId);
    const otherId = application.workerId === userId ? application.employerId : application.workerId;
    const other = findOne('users', u => u._id === otherId || u.id === otherId);
    const messages = find('messages', m => m.applicationId === application._id);
    const lastMessage = messages.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))[0] || null;
    return { applicationId: application._id, jobTitle: job?.title || 'Work discussion', otherUser: { id: otherId, name: other?.name || 'KaamSetu user' }, lastMessage };
  }).sort((a,b) => new Date(b.lastMessage?.createdAt || 0)-new Date(a.lastMessage?.createdAt || 0));
  res.json({ success: true, chats });
};

export const getMessages = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const application = findOne('applications', a => a._id === req.params.applicationId || a.id === req.params.applicationId);
  if (!canAccess(application, userId)) return res.status(403).json({ success:false, message:'Chat is available only to the accepted parties.' });
  const messages = find('messages', m => m.applicationId === application._id).sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
  res.json({ success:true, messages });
};

export const sendMessage = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const application = findOne('applications', a => a._id === req.params.applicationId || a.id === req.params.applicationId);
  if (!canAccess(application, userId)) return res.status(403).json({ success:false, message:'Chat is available only to the accepted parties.' });
  const { text, imageDataUrl } = req.body;
  const messageText = typeof text === 'string' ? text.trim().slice(0, 3000) : '';
  const validImage = typeof imageDataUrl === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(imageDataUrl) && imageDataUrl.length <= 5_000_000;
  if (!messageText && !validImage) return res.status(400).json({ success:false, message:'Write a message or attach a supported image (PNG, JPG, WEBP; max 3.7 MB).' });
  const message = insert('messages', { applicationId: application._id, senderId: userId, text: messageText, imageDataUrl: validImage ? imageDataUrl : null, readBy: [userId] });
  const recipientId = application.workerId === userId ? application.employerId : application.workerId;
  const sender = findOne('users', u => u._id === userId || u.id === userId);
  insert('notifications', { userId: recipientId, title: 'New KaamSetu message', message: `${sender?.name || 'Someone'} sent you a message.`, type: 'info', actionUrl: '/chats', isRead: false });
  res.status(201).json({ success:true, message });
};
