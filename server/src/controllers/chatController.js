import { find, findOne, insert, update } from '../services/storage.js';

const canAccess = (application, userId) => {
  const actorId = String(userId || '');
  const enabledStatuses = ['Accepted', 'InProgress', 'CompletionRequested', 'Completed'];
  if (!application || !enabledStatuses.includes(application.status) ||
      (String(application.workerId) !== actorId && String(application.employerId) !== actorId)) return false;
  const otherId = String(application.workerId) === userId ? String(application.employerId) : String(application.workerId);
  return !findOne('userBlocks', b =>
    (String(b.blockerId) === actorId && String(b.blockedId) === otherId) ||
    (String(b.blockerId) === otherId && String(b.blockedId) === actorId)
  );
};

export const listChats = async (req, res) => {
  const userId = String(req.user._id || req.user.id);
  const applications = find('applications', a => canAccess(a, userId));
  const chats = applications.map(application => {
    const job = findOne('jobs', j => String(j._id || j.id) === String(application.jobId));
    const otherId = application.workerId === userId ? application.employerId : application.workerId;
    const other = findOne('users', u => String(u._id || u.id) === otherId);
    const messages = find('messages', m => String(m.applicationId) === String(application._id || application.id));
    const lastMessage = messages.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))[0] || null;
    return { applicationId: String(application._id || application.id), jobTitle: job?.title || 'Work discussion', status: application.status, otherUser: { id: otherId, name: other?.name || 'KaamSetu user' }, lastMessage };
  }).sort((a,b) => new Date(b.lastMessage?.createdAt || 0)-new Date(a.lastMessage?.createdAt || 0));
  res.json({ success: true, chats });
};

export const getMessages = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const application = findOne('applications', a => a._id === req.params.applicationId || a.id === req.params.applicationId);
  if (!canAccess(application, userId)) return res.status(403).json({ success:false, message:'Chat is available only to the accepted parties.' });
  const messages = find('messages', m => String(m.applicationId) === String(application._id || application.id)).sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
  messages.forEach(message => {
    if (message.senderId !== userId && !(message.readBy || []).includes(userId)) {
      update('messages', message._id, { readBy: [...(message.readBy || []), userId] });
    }
  });
  res.json({ success:true, messages: messages.map(message => ({ ...message, readBy: message.senderId === userId ? (findOne('messages', m => m._id === message._id)?.readBy || []) : [...(message.readBy || []), userId] })) });
};

export const sendMessage = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const application = findOne('applications', a => a._id === req.params.applicationId || a.id === req.params.applicationId);
  if (!canAccess(application, userId)) return res.status(403).json({ success:false, message:'Chat is available only to the accepted parties.' });
  const { text, imageDataUrl } = req.body;
  const messageText = typeof text === 'string' ? text.trim().slice(0, 3000) : '';
  const validImage = typeof imageDataUrl === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(imageDataUrl) && imageDataUrl.length <= 5_000_000;
  if (!messageText && !validImage) return res.status(400).json({ success:false, message:'Write a message or attach a supported image (PNG, JPG, WEBP; max 3.7 MB).' });
  const message = insert('messages', { applicationId: String(application._id || application.id), senderId: userId, text: messageText, imageDataUrl: validImage ? imageDataUrl : null, readBy: [userId] });
  const recipientId = String(application.workerId) === userId ? String(application.employerId) : String(application.workerId);
  const sender = findOne('users', u => String(u._id || u.id) === userId);
  insert('notifications', { userId: recipientId, title: 'New KaamSetu message', message: `${sender?.name || 'Someone'} sent you a message.`, type: 'info', actionUrl: `/chats?applicationId=${encodeURIComponent(String(application._id || application.id))}`, isRead: false });
  res.status(201).json({ success:true, message });
};
