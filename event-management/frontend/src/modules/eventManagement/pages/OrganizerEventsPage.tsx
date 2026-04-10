import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi, saveAsTemplate, type ApiEvent } from '@/services/api';


// ─── FormatBadge / StatusBadge ────────────────────────────────────────────────
const FormatBadge: React.FC<{ format: string }> = ({ format }) => {
  const styles: Record<string, string> = {
    physical: 'bg-green-50 text-green-700 border-green-200',
    virtual:  'bg-purple-50 text-purple-700 border-purple-200',
    hybrid:   'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${styles[format] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {format}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    review: 'bg-orange-50 text-orange-700 border-orange-200',
    approved: 'bg-teal-50 text-teal-700 border-teal-200',
    published: 'bg-blue-50 text-blue-700 border-blue-200',
    ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    archived: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${styles[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
};

// ─── EventCard ────────────────────────────────────────────────────────────────
const EventCard: React.FC<{
  event: ApiEvent;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  onSaveAsTemplate: (id: string, title: string) => void;
}> = ({ event, onDelete, onStatusChange, onSaveAsTemplate }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleStatusChange = async (s: string) => {
    setStatusLoading(true);
    try { await onStatusChange(event._id, s); setMenuOpen(false); }
    finally { setStatusLoading(false); }
  };

  return (
    // Replaced overflow-hidden with relative + rounded corners to fix dropdown clip issue.
    <div className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group flex flex-col relative h-full">
      <div
        className="h-32 w-full bg-cover bg-center bg-gray-100 rounded-t-xl"
        style={{ backgroundImage: event.coverImage ? `url(${event.coverImage})` : `url(https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=random)` }}
      />

      <div className="p-5 flex flex-col flex-1 relative">
        {statusLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-b-xl">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate" title={event.title}>{event.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{event.eventType}</p>
          </div>

          <div className="relative flex-shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-800 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm">
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Actions</div>
                <button onClick={() => navigate(`/event?id=${event._id}`)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  Preview
                </button>
                <button onClick={() => { navigate(`/create-event?duplicateId=${event._id}`); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                  Duplicate
                </button>
                <button onClick={() => { onSaveAsTemplate(event._id, event.title); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                  Save as Template
                </button>
                <div className="h-px bg-gray-100 my-1" />
                {event.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange('published')}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-green-50 text-green-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5-4.5m0 0l4.5 4.5M12 7.5v13.5" /></svg>
                    Publish
                  </button>
                )}
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={() => { setDelConfirm(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3 flex-1 font-medium">
          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' - '}
          {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <StatusBadge status={event.status} />
          <FormatBadge format={event.format} />
          {event.visibility !== 'public' && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200 capitalize font-medium">
              {event.visibility.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <button onClick={() => navigate(`/create-event?id=${event._id}`)} className="flex-1 py-1.5 text-center text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">Edit</button>
          <button onClick={() => navigate(`/organizer/events/${event._id}/details`, { state: { eventTitle: event.title } })} className="flex-1 py-1.5 text-center text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm">View Details</button>
        </div>
      </div>

      {/* Delete Modal */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Delete "{event.title}"?</h3>
            <p className="text-sm text-gray-500 mb-5">This event will be permanently deleted. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button disabled={statusLoading} onClick={() => setDelConfirm(false)} className="flex-1 py-2 font-semibold border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">Cancel</button>
              <button
                disabled={statusLoading}
                onClick={async () => { setStatusLoading(true); await onDelete(event._id); setStatusLoading(false); setDelConfirm(false); }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 flex justify-center items-center gap-2 disabled:opacity-50 transition"
              >
                {statusLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── OrganizerEventsPage ──────────────────────────────────────────────────────
export const OrganizerEventsPage: React.FC = () => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const [saveTemplateModal, setSaveTemplateModal] = useState<{ id: string; title: string; defaultName: string; nameInput: string; loading: boolean } | null>(null);
  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventApi.list({ visibility: 'all' });
      setEvents(res.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await eventApi.delete(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      showToast('✓ Event deleted successfully.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleChangeStatus = async (id: string, s: string) => {
    try {
      const res = await eventApi.changeStatus(id, s);
      setEvents(prev => prev.map(e => e._id === id ? { ...e, status: res.data.status } : e));
      showToast(`✓ Status updated to ${s}`);
    } catch (e) {
      // Show actionable validation error when publish fails
      const errorMessage = e instanceof Error ? e.message : 'Failed to change status';
      alert(`Could not change status to ${s}:\n\n${errorMessage}`);
    }
  };

  const openSaveAsTemplate = (id: string, title: string) => {
    setSaveTemplateModal({ id, title, defaultName: `${title} (Template)`, nameInput: `${title} (Template)`, loading: false });
  };

  const handleConfirmSaveAsTemplate = async () => {
    if (!saveTemplateModal) return;
    const { id, nameInput } = saveTemplateModal;
    setSaveTemplateModal(prev => prev ? { ...prev, loading: true } : null);
    try {
      await saveAsTemplate(id, nameInput.trim() || undefined);
      showToast('✓ Template saved! View it in Template Manager.');
      setSaveTemplateModal(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save template');
      setSaveTemplateModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error)   return <div className="p-8 text-red-600 font-medium">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Save Template Modal */}
      {saveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Save as Template</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter a name for this template. The current values of "{saveTemplateModal.title}" will be used as defaults.
            </p>
            <input
              type="text"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none mb-5"
              value={saveTemplateModal.nameInput}
              onChange={(e) => setSaveTemplateModal(prev => prev ? { ...prev, nameInput: e.target.value } : null)}
              placeholder={saveTemplateModal.defaultName}
            />
            <div className="flex gap-2">
              <button disabled={saveTemplateModal.loading} onClick={() => setSaveTemplateModal(null)} className="flex-1 py-2 font-semibold border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">Cancel</button>
              <button
                disabled={saveTemplateModal.loading}
                onClick={handleConfirmSaveAsTemplate}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50 transition"
              >
                {saveTemplateModal.loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Events</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, edit, and track your events</p>
        </div>
        <button
          onClick={() => navigate('/create-event')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Create New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 mt-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
          </div>
          <p className="text-gray-900 font-bold mb-1 text-lg">No Events Found</p>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">You haven't created any events yet. Build your first event to reach attendees!</p>
          <button onClick={() => navigate('/create-event')} className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow hover:bg-blue-700 transition">
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map(event => (
            <EventCard
              key={event._id}
              event={event}
              onDelete={handleDelete}
              onStatusChange={handleChangeStatus}
              onSaveAsTemplate={openSaveAsTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
