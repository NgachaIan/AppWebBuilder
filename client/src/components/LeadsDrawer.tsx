import { useEffect, useState } from 'react';
import { Inbox, Mail, MessageCircle, Phone, Trash2, X } from 'lucide-react';
import type { Lead } from '@shared/types';
import { normalisePhone } from '@shared/render';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useConfirm } from '../lib/confirm';

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeadsDrawer({ projectId, projectName, onClose, onChange }: { projectId: string; projectName: string; onClose: () => void; onChange: () => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    api.leads(projectId).then(setLeads).catch((e) => toast(e.message, 'error'));
  }, [projectId, toast]);

  async function toggle(l: Lead) {
    const upd = await api.markLead(projectId, l.id, !l.read);
    setLeads((ls) => ls!.map((x) => (x.id === l.id ? upd : x)));
    onChange();
  }

  async function remove(l: Lead) {
    if (!(await confirm(`Delete the message from ${l.name}?`))) return;
    await api.deleteLead(projectId, l.id);
    setLeads((ls) => ls!.filter((x) => x.id !== l.id));
    onChange();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold">Messages</h2>
            <p className="text-sm text-slate-500">From the contact form on {projectName}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-4">
          {leads === null && <p className="p-6 text-center text-sm text-slate-400">Loading…</p>}
          {leads?.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-500">
              <Inbox className="size-10 text-slate-300" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">When visitors use the contact form on your published site, their messages appear here.</p>
            </div>
          )}
          <ul className="space-y-3">
            {leads?.map((l) => {
              const wa = normalisePhone(l.phone);
              return (
                <li key={l.id} className={`rounded-xl border p-4 ${l.read ? 'border-slate-200' : 'border-brand-200 bg-brand-50/50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        {!l.read && <span className="size-2 rounded-full bg-brand-600" aria-label="Unread" />}
                        {l.name}
                      </div>
                      <div className="text-xs text-slate-500">{timeAgo(l.createdAt)}{l.page ? ` · /${l.page}` : ''}</div>
                    </div>
                    <div className="flex">
                      <button className="icon-btn" title={l.read ? 'Mark unread' : 'Mark read'} onClick={() => toggle(l)}>
                        <Mail className="size-4" />
                      </button>
                      <button className="icon-btn hover:text-rose-600" title="Delete" onClick={() => remove(l)}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700">{l.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {wa && (
                      <a className="btn-secondary !py-1.5 text-xs" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </a>
                    )}
                    {l.phone && (
                      <a className="btn-secondary !py-1.5 text-xs" href={`tel:${l.phone}`}>
                        <Phone className="size-3.5" /> {l.phone}
                      </a>
                    )}
                    {l.email && (
                      <a className="btn-secondary !py-1.5 text-xs" href={`mailto:${l.email}`}>
                        <Mail className="size-3.5" /> {l.email}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
