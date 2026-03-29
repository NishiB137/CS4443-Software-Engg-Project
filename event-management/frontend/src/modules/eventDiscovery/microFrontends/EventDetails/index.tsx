import React, { useState, useEffect } from 'react';
import { useEventDetails } from '@/modules/eventDiscovery/microFrontends/EventDetails/hooks/useEventDetails';
import { SupportTicketModal } from '@/modules/eventDiscovery/microFrontends/EventDetails/components/SupportTicketModal';
import { format } from 'date-fns';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-background min-h-screen pb-20 animate-pulse">
    <div className="relative h-[450px] w-full bg-gray-200" />
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-surface rounded-2xl p-8 border border-border space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-border space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-surface rounded-2xl p-6 border border-border space-y-3 h-40">
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Error state ──────────────────────────────────────────────────────────────
const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6">
    <div className="text-center max-w-md">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Event Not Found</h2>
      <p className="text-text-secondary text-sm mb-6">{message}</p>
      <a href="/" className="inline-block bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition">
        Browse Events
      </a>
    </div>
  </div>
);

// ─── Helper: format ISO datetime for sessions ─────────────────────────────────
const formatSessionTime = (iso: string): string => {
  if (!iso) return '';
  try { return format(new Date(iso), 'MMM d, yyyy • h:mm a'); } catch { return iso; }
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  keynote:           '🎤 Keynote',
  panel:             '💬 Panel',
  workshop:          '🛠️ Workshop',
  networking:        '🤝 Networking',
  performance:       '🎭 Performance',
  competition_round: '🏆 Competition Round',
  break:             '☕ Break',
  other:             '📋 Session',
};

// ─── Main component ───────────────────────────────────────────────────────────
export const EventDetailsMFE: React.FC = () => {
  const {
    event, loading, error,
    isTicketModalOpen, setIsTicketModalOpen,
    isLiked, toggleLike, likeBusy,
    isBookmarked, setIsBookmarked,
    selectedTicketId, setSelectedTicketId,
    comments, handleAddComment,
  } = useEventDetails();

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [commentInput, setCommentInput]       = useState('');
  const [activeTab, setActiveTab]             = useState<'details' | 'agenda' | 'venue' | 'policies'>('details');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Auto-play slideshow
  useEffect(() => {
    if (!event?.images?.length) return;
    const timer = setInterval(() => {
      setCurrentImageIdx(p => (p + 1) % event.images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [event?.images?.length]);

  if (loading) return <Skeleton />;
  if (error || !event) return <ErrorState message={error ?? 'Event could not be loaded.'} />;

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddComment(commentInput);
    setCommentInput('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    alert('Share link copied to clipboard!');
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <SupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        organizerName={event.organizer.name}
      />

      {/* ── Hero Slideshow ── */}
      <div className="relative h-[450px] w-full group overflow-hidden bg-secondary">
        {event.images.map((img, idx) => (
          img.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              key={idx}
              src={img}
              autoPlay
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentImageIdx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <img
              key={idx}
              src={img}
              alt={`${event.title} — ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentImageIdx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-transparent" />

        {/* Slideshow navigation */}
        {event.images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIdx(p => (p - 1 + event.images.length) % event.images.length)}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-sm z-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentImageIdx(p => (p + 1) % event.images.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-sm z-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {event.images.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {event.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIdx(i)}
                className={`transition-all duration-300 rounded-full h-2 ${
                  i === currentImageIdx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-6 right-6 flex gap-3 z-20">
          <button
            type="button"
            disabled={likeBusy}
            onClick={() => void toggleLike()}
            title={isLiked ? 'Liked' : 'Like this event'}
            className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition disabled:opacity-60"
          >
            <svg className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition"
          >
            <svg className={`w-6 h-6 ${isBookmarked ? 'fill-primary text-primary' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={handleShare}
            className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12" />
            </svg>
          </button>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 w-full p-8 z-10">
          <div className="max-w-7xl mx-auto text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {event.tags.map(tag => (
                <span key={tag} className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 capitalize shadow-sm">
                  {tag}
                </span>
              ))}
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm capitalize">
                {event.format}
              </span>
              {event.isFree && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/80 backdrop-blur-sm">
                  Free
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-md">{event.title}</h1>

            {event.shortDescription && (
              <p className="text-lg opacity-90 mb-3 max-w-2xl">{event.shortDescription}</p>
            )}

            <p className="text-base font-medium opacity-90 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                {event.dateInfo}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                {event.locationInfo}
              </span>
            </p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm font-semibold opacity-90">
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                {event.registeredCount} Registered
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                {event.views} Views
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                {event.likes} Likes
              </span>
              {event.maxCapacity && (
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                  {event.maxCapacity} Capacity
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">

          {/* About */}
          <section className="bg-surface p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-4">About This Event</h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-line">{event.description}</p>

            {/* Tabs */}
            <div className="flex border-b border-border mt-6 mb-4 overflow-x-auto hide-scrollbar">
              {(['details', 'agenda', 'venue', 'policies'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <div className="space-y-4 text-sm text-text-secondary">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Start</p>
                    <p className="text-text-primary font-medium">{event.dateInfo}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">End</p>
                    <p className="text-text-primary font-medium">{event.endDateInfo}</p>
                  </div>
                  {event.timezone && (
                    <div className="bg-background rounded-xl p-4 border border-border">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Timezone</p>
                      <p className="text-text-primary font-medium">{event.timezone}</p>
                    </div>
                  )}
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Format</p>
                    <p className="text-text-primary font-medium capitalize">{event.format}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="py-4 space-y-4">
                {(!event.policies.refundPolicy && !event.policies.cancellationPolicy && (!event.policies.attendeeMinAge || event.policies.attendeeMinAge <= 0)) ? (
                  <p className="text-sm text-text-secondary italic">No specific policies listed for this event.</p>
                ) : (
                  <div className="bg-background rounded-xl p-5 border border-border space-y-4 text-sm">
                    {event.policies.refundPolicy && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Refund Policy</p>
                        <p className="text-text-primary capitalize">{event.policies.refundPolicy.replace('_', ' ')}</p>
                      </div>
                    )}
                    {event.policies.cancellationPolicy && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Cancellation Policy</p>
                        <p className="text-text-primary leading-relaxed">{event.policies.cancellationPolicy}</p>
                      </div>
                    )}
                    {event.policies.attendeeMinAge != null && event.policies.attendeeMinAge > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Minimum Age</p>
                        <p className="text-text-primary">{event.policies.attendeeMinAge}+</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="py-4">
                {event.sessions.length === 0 ? (
                  <div className="text-center py-8 bg-background rounded-xl border border-border border-dashed">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-text-secondary font-medium">No sessions have been added yet.</p>
                    <p className="text-text-secondary text-sm mt-1">Check back closer to the event date for the full agenda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {event.sessions.map(session => {
                      const isExpanded = expandedSession === session.id;
                      return (
                        <div key={session.id} className="border border-border rounded-xl overflow-hidden shadow-sm">
                          {/* Session header */}
                          <button
                            onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-background transition text-left bg-surface"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                                {SESSION_TYPE_LABELS[session.sessionType] ?? '📋 Session'}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate">{session.title}</p>
                                {session.startTime && (
                                  <p className="text-xs text-text-secondary mt-0.5 font-medium">
                                    {formatSessionTime(session.startTime)}
                                    {session.endTime && ` → ${formatSessionTime(session.endTime)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              {session.room && (
                                <span className="text-xs text-text-secondary hidden sm:block bg-background px-2 py-0.5 rounded border border-border">📍 {session.room}</span>
                              )}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                session.status === 'live'      ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' :
                                session.status === 'completed' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                                'bg-green-50 text-green-600 border border-green-200 shadow-sm'
                              }`}>
                                {session.status === 'live' ? '🔴 Live' : session.status === 'completed' ? 'Completed' : 'Scheduled'}
                              </span>
                              <svg className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {/* Expanded session details */}
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-border bg-background space-y-4">
                              {session.description && (
                                <p className="text-sm text-text-secondary leading-relaxed pt-4">{session.description}</p>
                              )}

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                {session.room && (
                                  <div className="bg-surface rounded-lg p-3 border border-border shadow-sm">
                                    <p className="text-text-secondary font-medium mb-0.5 uppercase tracking-wide text-[10px]">Room / Location</p>
                                    <p className="text-text-primary font-semibold">{session.room}</p>
                                  </div>
                                )}
                                {session.maxAttendees && (
                                  <div className="bg-surface rounded-lg p-3 border border-border shadow-sm">
                                    <p className="text-text-secondary font-medium mb-0.5 uppercase tracking-wide text-[10px]">Capacity</p>
                                    <p className="text-text-primary font-semibold">{session.maxAttendees.toLocaleString()}</p>
                                  </div>
                                )}
                                {session.streamUrl && (
                                  <div className="bg-surface rounded-lg p-3 border border-border shadow-sm">
                                    <p className="text-text-secondary font-medium mb-0.5 uppercase tracking-wide text-[10px]">Stream</p>
                                    <a href={session.streamUrl} target="_blank" rel="noreferrer"
                                      className="text-primary underline text-xs break-all font-medium">
                                      Watch online
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Tags */}
                              {session.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                  {session.tags.map(tag => (
                                    <span key={tag} className="text-[11px] font-medium bg-surface border border-border text-text-secondary px-2.5 py-1 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Speakers */}
                              {session.speakers.length > 0 && (
                                <div className="pt-2 border-t border-border/50 mt-4">
                                  <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-3">Speakers</p>
                                  <div className="space-y-3">
                                    {session.speakers.map((speaker, si) => (
                                      <div key={si} className="flex items-start gap-3 bg-surface p-3 rounded-xl border border-border">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden shadow-sm">
                                          {speaker.avatarUrl
                                            ? <img src={speaker.avatarUrl} alt={speaker.name} className="w-full h-full object-cover" />
                                            : (speaker.name?.[0] ?? 'S')
                                          }
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-text-primary">{speaker.name ?? 'Speaker'}</p>
                                          {(speaker.designation || speaker.organization) && (
                                            <p className="text-xs text-text-secondary font-medium">
                                              {[speaker.designation, speaker.organization].filter(Boolean).join(', ')}
                                            </p>
                                          )}
                                          {speaker.topic && (
                                            <p className="text-xs font-medium text-primary mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded">Topic: {speaker.topic}</p>
                                          )}
                                          {speaker.bio && (
                                            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{speaker.bio}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'venue' && (
              <div className="py-4">
                {event.format === 'virtual' ? (
                  <div className="text-sm text-text-secondary space-y-2">
                    <p className="text-text-primary font-medium">This is an online event.</p>
                    {event.onlineLink && (
                      <a href={event.onlineLink} target="_blank" rel="noreferrer"
                        className="inline-block text-primary underline break-all">
                        {event.onlineLink}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-background rounded-xl p-4 border border-border text-sm text-text-secondary">
                    <p className="text-text-primary font-semibold mb-1">📍 Venue</p>
                    <p>{event.locationInfo}</p>
                    <div className="mt-2 flex gap-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationInfo)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-xs"
                      >
                        Open in Google Maps
                      </a>
                      <button
                        type="button"
                        className="text-xs text-gray-600 underline"
                        onClick={() => navigator.clipboard?.writeText(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationInfo)}`)}
                      >
                        Copy map link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Ticket Selection */}
          {(event.tickets.length > 0 || !event.isFree) && (
            <section className="bg-surface p-8 rounded-2xl shadow-sm border border-border" id="tickets">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {event.isFree ? 'Register for Free' : 'Select Your Ticket'}
              </h2>

              {event.isFree ? (
                <div className="border-2 border-green-400 bg-green-50 p-5 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">Free Admission</h3>
                    <p className="text-sm text-text-secondary mt-1">This event is free to attend</p>
                  </div>
                  <span className="text-3xl font-extrabold text-green-600">Free</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.tickets.map(ticket => {
                    const isSelected = selectedTicketId === ticket.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => ticket.available && setSelectedTicketId(ticket.id)}
                        className={`border-2 p-5 rounded-xl flex justify-between items-center transition-all ${
                          !ticket.available
                            ? 'border-border/50 opacity-60 bg-background cursor-not-allowed'
                            : isSelected
                              ? 'border-primary bg-blue-50 ring-4 ring-blue-100 cursor-pointer shadow-md'
                              : 'border-border hover:border-primary/50 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            {ticket.available && (
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-primary' : 'border-gray-300'
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                              </div>
                            )}
                            <h3 className="font-bold text-lg text-text-primary">{ticket.type}</h3>
                          </div>
                          <p className="text-sm text-text-secondary mt-1 ml-8">{ticket.desc}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-extrabold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                            ${ticket.price}
                          </div>
                          {!ticket.available && (
                            <span className="text-xs font-bold text-red-500 uppercase">Sold Out</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-text-secondary text-sm">
                  {event.isFree
                    ? 'Click Register to confirm your free spot.'
                    : selectedTicketId
                      ? 'Ticket selected. Proceed to secure checkout.'
                      : 'Please select a ticket type to continue.'}
                </p>
                <button
                  disabled={!event.isFree && !selectedTicketId}
                  className={`px-10 py-4 rounded-full font-bold shadow-lg transition-all ${
                    event.isFree || selectedTicketId
                      ? 'bg-primary text-white hover:bg-primary-hover hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {event.isFree ? 'Register for Free' : 'Proceed to Register'}
                  </button>
                </div>
              </section>
            )}

          {/* ── FAQs ── always shown ── */}
          <section className="bg-surface p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Frequently Asked Questions</h2>

            {event.faqs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-text-secondary text-sm">No FAQs have been added for this event.</p>
                <p className="text-text-secondary text-xs mt-1">
                  Use the Discussion section below to ask your questions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {event.faqs.map((faq, i) => (
                  <details key={i} className="group border border-border rounded-xl overflow-hidden">
                    <summary className="px-5 py-4 font-semibold text-text-primary cursor-pointer list-none flex items-center justify-between hover:bg-background transition">
                      {faq.question}
                      <svg className="w-4 h-4 text-text-secondary group-open:rotate-180 transition-transform shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 pt-2 text-sm text-text-secondary bg-background leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* Discussion */}
          <section className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-6">
              Discussion ({comments.length})
            </h2>

            <form onSubmit={submitComment} className="mb-6 flex gap-3 items-start">
              <img
                src="https://ui-avatars.com/api/?name=You&background=2563EB&color=fff"
                alt="You"
                className="w-10 h-10 rounded-full shadow-sm"
              />
              <div className="flex-grow">
                <textarea
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="Join the conversation..."
                  className="w-full bg-background border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </form>

            {comments.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-8 italic">
                Be the first to comment on this event!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                    <img src={comment.avatar} alt={comment.author} className="w-9 h-9 rounded-full shadow-sm mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-text-primary text-sm mb-0.5">{comment.author}</h4>
                      <p className="text-sm text-text-secondary leading-snug break-words">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Details card */}
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
            <h3 className="font-bold text-lg text-text-primary mb-4 border-b border-border pb-2">Details</h3>
            <div className="space-y-4 text-sm text-text-secondary">
              <div>
                <strong className="block text-text-primary mb-1">Date & Time</strong>
                <p>{event.dateInfo}</p>
                <p className="text-xs mt-0.5 text-text-secondary">to {event.endDateInfo}</p>
                {event.timezone && <p className="text-xs text-text-secondary">{event.timezone}</p>}
              </div>
              <div>
                <strong className="block text-text-primary mb-1">Location</strong>
                <p>{event.locationInfo}</p>
                {event.onlineLink && event.format !== 'physical' && (
                  <a href={event.onlineLink} target="_blank" rel="noreferrer"
                    className="text-xs text-primary underline block mt-1 break-all">
                    Join Online
                  </a>
                )}
              </div>
              {event.maxCapacity && (
                <div>
                  <strong className="block text-text-primary mb-1">Capacity</strong>
                  <p>{event.maxCapacity.toLocaleString()} attendees</p>
                </div>
              )}
            </div>

            {event.tags.length > 0 && (
              <div className="mt-5">
                <strong className="block text-text-primary mb-2 text-sm">Tags</strong>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map(tag => (
                    <span key={tag} className="bg-background border border-border text-text-secondary text-xs px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Organizer card */}
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border text-center">
            <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide">Organized By</h3>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full p-1 border-2 border-primary/20 shadow-sm bg-gradient-to-br from-white to-gray-50">
              <img
                src={event.organizer.logo}
                alt={event.organizer.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.name)}&background=2563EB&color=fff`; }}
              />
            </div>
            <h4 className="font-bold text-lg text-text-primary mb-1">{event.organizer.name}</h4>
            <p className="text-sm text-text-secondary mb-4">{event.organizer.followers} Registered</p>
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="w-full bg-secondary text-white font-semibold py-2.5 rounded-lg hover:bg-secondary-hover transition"
            >
              Contact Organizer / Support
            </button>
          </div>

          {/* ── Point of Contact ── NEW SECTION ── */}
          {(event.pocDetails.name || event.pocDetails.email) && (
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="font-bold text-text-primary mb-4">Point of Contact</h3>
              <div className="space-y-3 text-sm">
                {event.pocDetails.name && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {event.pocDetails.name[0]}
                    </div>
                    <span className="text-text-primary font-medium">{event.pocDetails.name}</span>
                  </div>
                )}
                {event.pocDetails.email && (
                  <a href={`mailto:${event.pocDetails.email}`}
                    className="flex items-center gap-2.5 text-text-secondary hover:text-primary transition">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-all">{event.pocDetails.email}</span>
                  </a>
                )}
                {event.pocDetails.phone && (
                  <a href={`tel:${event.pocDetails.phone}`}
                    className="flex items-center gap-2.5 text-text-secondary hover:text-primary transition">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{event.pocDetails.phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sponsors */}
          {event.sponsors.length > 0 && (
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide">Sponsors</h3>
              <div className="space-y-3">
                {event.sponsors.map(name => (
                  <div key={name} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:shadow-sm transition">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner overflow-hidden shrink-0">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-semibold text-text-primary text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
