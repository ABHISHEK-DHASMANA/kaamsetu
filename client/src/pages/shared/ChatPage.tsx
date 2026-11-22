import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Send, ImagePlus, RefreshCw, ShieldBan } from 'lucide-react';

type Chat = { applicationId:string; jobTitle:string; status?:string; otherUser:{id:string;name:string}; lastMessage?:{text?:string;createdAt:string}|null };
type Message = { _id:string; senderId:string; text?:string; imageDataUrl?:string|null; createdAt:string; readBy?:string[] };

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const auth = () => ({'Content-Type':'application/json',Authorization:`Bearer ${sessionStorage.getItem('kaamsetu_token') || ''}`});

export const ChatPage:React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedApplicationId = searchParams.get('applicationId');
  const [chats,setChats]=useState<Chat[]>([]);
  const [active,setActive]=useState<Chat|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [draft,setDraft]=useState('');
  const [image,setImage]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const loadChats=useCallback(async()=>{try{const r=await fetch(`${API}/chats`,{headers:auth()});const d=await r.json();if(!r.ok)throw new Error(d.message);const nextChats: Chat[] = d.chats || [];setChats(nextChats);}catch(e:any){setError(e.message||'Unable to load chats.');}},[]);
  const loadMessages=useCallback(async(id:string)=>{try{const r=await fetch(`${API}/chats/${id}/messages`,{headers:auth()});const d=await r.json();if(!r.ok)throw new Error(d.message);setMessages(d.messages||[]);setError('');}catch(e:any){setError(e.message||'Unable to load messages.');}},[]);
  useEffect(()=>{loadChats();const t=window.setInterval(loadChats,10000);return()=>window.clearInterval(t);},[loadChats]);
  useEffect(()=>{if(!requestedApplicationId)return;const match=chats.find(chat=>chat.applicationId===requestedApplicationId);if(match)setActive(match);},[requestedApplicationId,chats]);
  useEffect(()=>{if(!active)return;loadMessages(active.applicationId);const t=window.setInterval(()=>loadMessages(active.applicationId),4000);return()=>window.clearInterval(t);},[active,loadMessages]);
  const send=async()=>{if(!active||(!draft.trim()&&!image)||busy)return;setBusy(true);try{const r=await fetch(`${API}/chats/${active.applicationId}/messages`,{method:'POST',headers:auth(),body:JSON.stringify({text:draft,imageDataUrl:image})});const d=await r.json();if(!r.ok)throw new Error(d.message);setMessages(v=>[...v,d.message]);setDraft('');setImage(null);loadChats();}catch(e:any){setError(e.message||'Message could not be sent.');}finally{setBusy(false);}};
  const chooseImage=(file?:File)=>{if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setError('Choose a PNG, JPG or WEBP image.');return;}if(file.size>3.7*1024*1024){setError('Image must be smaller than 3.7 MB.');return;}const reader=new FileReader();reader.onload=()=>setImage(String(reader.result));reader.readAsDataURL(file);};
  const block=async()=>{if(!active||!window.confirm(`Block ${active.otherUser.name}? You will no longer be able to continue this conversation.`))return;try{const r=await fetch(`${API}/social/blocks/${active.otherUser.id}`,{method:'POST',headers:auth()});const d=await r.json();if(!r.ok)throw new Error(d.message);setActive(null);setMessages([]);setError('User blocked.');}catch(e:any){setError(e.message||'Could not block user.');}};
  return <DashboardLayout title="Messages" subtitle="Chat with people connected to your accepted work">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[620px]">
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b font-bold flex items-center justify-between"><span>Conversations</span><button onClick={loadChats} aria-label="Refresh chats"><RefreshCw className="w-4 h-4"/></button></div>
        {chats.length===0?<div className="p-6 text-sm text-slate-500">Your hired work conversations appear here. Chat stays available while work is in progress and after completion.</div>:chats.map(chat=><button key={chat.applicationId} onClick={()=>setActive(chat)} className={`w-full text-left p-4 border-b hover:bg-slate-50 ${active?.applicationId===chat.applicationId?'bg-blue-50':''}`}><div className="font-semibold text-slate-800">{chat.otherUser.name}</div><div className="text-xs text-slate-500">{chat.jobTitle}{chat.status?` · ${chat.status}`:''}</div><div className="text-xs text-slate-400 mt-1 truncate">{chat.lastMessage?.text||'Start a conversation'}</div></button>)}
      </section>
      <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
        {active?<><header className="p-4 border-b flex items-center justify-between"><div><div className="font-bold">{active.otherUser.name}</div><div className="text-xs text-slate-500">{active.jobTitle}{active.status?` · ${active.status}`:''}</div></div><button onClick={block} className="text-xs text-red-600 flex items-center gap-1"><ShieldBan className="w-4 h-4"/>Block</button></header>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[440px]">{messages.map(m=><div key={m._id} className={`max-w-[80%] rounded-2xl p-3 text-sm ${m.senderId===user?._id?'ml-auto bg-blue-600 text-white':'bg-slate-100 text-slate-800'}`}>{m.text&&<p className="whitespace-pre-wrap break-words">{m.text}</p>}{m.imageDataUrl&&<img src={m.imageDataUrl} alt="Shared attachment" className="mt-2 max-w-full rounded-lg max-h-64"/>}<div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleString()}{m.senderId===user?._id && m.readBy?.includes(active.otherUser.id) ? ' · Seen' : ''}</div></div>)}</div>
          {image&&<div className="px-4 text-xs text-slate-500">Image attached <button onClick={()=>setImage(null)} className="text-red-600 ml-2">Remove</button></div>}
          <div className="p-3 border-t flex items-end gap-2"><label className="p-2 cursor-pointer text-slate-500 hover:bg-slate-100 rounded-lg" title="Attach image"><ImagePlus className="w-5 h-5"/><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>chooseImage(e.target.files?.[0])}/></label><textarea value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Write a message..." rows={2} maxLength={3000} className="flex-1 resize-none border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"/><button disabled={busy||(!draft.trim()&&!image)} onClick={send} className="p-3 rounded-xl bg-blue-600 text-white disabled:opacity-40"><Send className="w-5 h-5"/></button></div>
        </>:<div className="flex-1 flex flex-col items-center justify-center text-slate-400"><MessageCircle className="w-12 h-12 mb-3"/><div className="font-semibold">Select a conversation</div><p className="text-sm mt-1">Your work conversations will appear here.</p></div>}
      </section>
    </div>{error&&<p role="alert" className="mt-3 text-sm text-amber-700">{error}</p>}
  </DashboardLayout>;
};
