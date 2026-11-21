import { find, findOne, insert, remove } from '../services/storage.js';

export const getSavedJobs = async (req,res) => {
  const userId=req.user._id || req.user.id;
  const saved=find('savedJobs',s=>s.userId===userId);
  const jobs=saved.map(s=>findOne('jobs',j=>j._id===s.jobId || j.id===s.jobId)).filter(Boolean);
  res.json({success:true,jobs});
};
export const toggleSavedJob = async (req,res) => {
  const userId=req.user._id || req.user.id;
  const job=findOne('jobs',j=>j._id===req.params.jobId || j.id===req.params.jobId);
  if(!job) return res.status(404).json({success:false,message:'Job not found.'});
  const existing=findOne('savedJobs',s=>s.userId===userId && s.jobId===(job._id||job.id));
  if(existing){remove('savedJobs',existing._id);return res.json({success:true,saved:false});}
  insert('savedJobs',{userId,jobId:job._id||job.id});
  res.json({success:true,saved:true});
};
export const getBlocks = async (req,res) => {
  const userId=req.user._id || req.user.id;
  res.json({success:true,blockedUsers:find('userBlocks',b=>b.blockerId===userId).map(b=>b.blockedId)});
};
export const blockUser = async (req,res) => {
  const userId=req.user._id || req.user.id;
  const targetId=String(req.params.userId);
  if(!targetId || targetId===userId) return res.status(400).json({success:false,message:'Invalid user to block.'});
  if(!findOne('users',u=>u._id===targetId || u.id===targetId)) return res.status(404).json({success:false,message:'User not found.'});
  if(!findOne('userBlocks',b=>b.blockerId===userId && b.blockedId===targetId)) insert('userBlocks',{blockerId:userId,blockedId:targetId});
  res.json({success:true,message:'User blocked.'});
};
export const unblockUser = async (req,res) => {
  const userId=req.user._id || req.user.id;
  const entry=findOne('userBlocks',b=>b.blockerId===userId && b.blockedId===String(req.params.userId));
  if(entry) remove('userBlocks',entry._id);
  res.json({success:true,message:'User unblocked.'});
};
