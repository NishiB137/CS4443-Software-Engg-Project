import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi, type ApiEvent } from '@/services/api';

const STATUS_COLOR: Record<string, string> = {
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  published: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=60';

export const AdminReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectBox, setShowRejectBox] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<{ id: string; type: 'approved' | 'rejected' } | null>(null);

  const userId = localStorage.getItem('userId') ?? undefined;
  const role = localStorage.getItem('userRole');

  useEffect(() => {
    if (role !== 'superadmin') {
      navigate('/', { replace: true });
      return;
    }
    loadPending();
  }, [role]);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventApi.listPendingReview();
      setEvents(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await eventApi.approve(id, userId);
      setFlash({ id, type: 'approved' });
      setTimeout(() => {
        setFlash(null);
        setEvents((prev) => prev.filter((e) => e._id !== id));
      }, 1200);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await eventApi.reject(id, userId, rejectReason[id]);
      setFlash({ id, type: 'rejected' });
      setTimeout(() => {
        setFlash(null);
        setEvents((prev) => prev.filter((e) => e._id !== id));
      }, 1200);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setActionLoading(null);
      setShowRejectBox((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (role !== 'superadmin') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Event Review Queue</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {events.length} event{events.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={loadPending}
              className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 rounded-xl transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-700">All clear!</h2>
            <p className="text-gray-500 mt-1 text-sm">No events are pending review right now.</p>
          </div>
        )}

        <div className="space-y-4">
          {events.map((ev) => {
            const isFlash = flash?.id === ev._id;
            const isApproving = actionLoading === ev._id;

            return (
              <div
                key={ev._id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-500 ${
                  isFlash
                    ? flash?.type === 'approved'
                      ? 'border-green-400 ring-2 ring-green-200'
                      : 'border-red-400 ring-2 ring-red-200'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex gap-5 p-5">
                  {/* Cover */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={ev.coverImage || FALLBACK_IMG}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h2 className="font-black text-gray-900 text-base leading-tight flex-1 truncate">{ev.title}</h2>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[ev.status] || STATUS_COLOR['review']}`}>
                        {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                        {ev.format}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {ev.organizerName || (typeof ev.createdBy === 'object' ? (ev.createdBy as any).name : ev.createdBy) || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 rounded-full">
                        {ev.eventType}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleApprove(ev._id)}
                        disabled={isApproving || !!flash}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition flex items-center gap-1.5"
                      >
                        {isApproving ? (
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        Approve & Publish
                      </button>

                      <button
                        onClick={() => setShowRejectBox((prev) => ({ ...prev, [ev._id]: !prev[ev._id] }))}
                        disabled={isApproving || !!flash}
                        className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl disabled:opacity-50 transition"
                      >
                        Reject
                      </button>

                      <a
                        href={`/event?slug=${ev.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold rounded-xl transition"
                      >
                        Preview
                      </a>
                    </div>

                    {/* Reject reason box */}
                    {showRejectBox[ev._id] && (
                      <div className="mt-3 flex gap-2 items-end">
                        <textarea
                          rows={2}
                          placeholder="Rejection reason (optional)..."
                          value={rejectReason[ev._id] || ''}
                          onChange={(e) => setRejectReason((prev) => ({ ...prev, [ev._id]: e.target.value }))}
                          className="flex-1 border border-red-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                        />
                        <button
                          onClick={() => handleReject(ev._id)}
                          disabled={isApproving}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition shrink-0"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flash overlay */}
                {isFlash && (
                  <div className={`px-5 py-2 text-center text-sm font-bold ${flash?.type === 'approved' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {flash?.type === 'approved' ? '✓ Approved & published!' : '✕ Rejected — sent back to draft'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
