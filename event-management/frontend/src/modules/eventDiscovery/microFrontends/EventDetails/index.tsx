import React, { useState, useEffect } from 'react';
import { useEventDetails } from '@/modules/eventDiscovery/microFrontends/EventDetails/hooks/useEventDetails';
import { SupportTicketModal } from '@/modules/eventDiscovery/microFrontends/EventDetails/components/SupportTicketModal';

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

// ─── Main component ───────────────────────────────────────────────────────────
export const EventDetailsMFE: React.FC = () => {
  const {
    event, loading, error,
    isTicketModalOpen, setIsTicketModalOpen,
    isLiked, setIsLiked,
    isBookmarked, setIsBookmarked,
    selectedTicketId, setSelectedTicketId,
    comments, handleAddComment,
  } = useEventDetails();

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [commentInput, setCommentInput]       = useState('');
  const [activeTab, setActiveTab]             = useState<'details' | 'agenda' | 'venue'>('details');

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
          <img
            key={idx}
            src={img}
            alt={`${event.title} — ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentImageIdx ? 'opacity-100' : 'opacity-0'
            }`}
          />
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
            onClick={() => setIsLiked(!isLiked)}
            className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-5.368m0 5.368l5.662 3.397m-5.662-3.397l5.662-3.397" />
            </svg>
          </button>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 w-full p-8 z-10">
          <div className="max-w-7xl mx-auto text-white">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                event.status === 'published' ? 'bg-green-500/80 backdrop-blur-sm' :
                event.status === 'ongoing'   ? 'bg-blue-500/80 backdrop-blur-sm' :
                'bg-gray-500/80 backdrop-blur-sm'
              }`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
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
              <span>📅 {event.dateInfo}</span>
              <span>📍 {event.locationInfo}</span>
            </p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm font-semibold opacity-90">
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                👥 {event.registeredCount} Registered
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                👁️ {event.views} Views
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                ❤️ {event.likes} Likes
              </span>
              {event.maxCapacity && (
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  🎟️ {event.maxCapacity} capacity
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
            <div className="flex border-b border-border mt-6 mb-4">
              {(['details', 'agenda', 'venue'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
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

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map(tag => (
                        <span key={tag} className="bg-background border border-border text-text-secondary text-xs px-3 py-1.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policies */}
                {(event.policies.refundPolicy || event.policies.cancellationPolicy) && (
                  <div className="mt-4 border-t border-border pt-4 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Policies</p>
                    {event.policies.refundPolicy && (
                      <p><strong className="text-text-primary">Refund:</strong> {event.policies.refundPolicy.replace('_', ' ')}</p>
                    )}
                    {event.policies.cancellationPolicy && (
                      <p><strong className="text-text-primary">Cancellation:</strong> {event.policies.cancellationPolicy}</p>
                    )}
                    {event.policies.attendeeMinAge != null && event.policies.attendeeMinAge > 0 && (
                      <p><strong className="text-text-primary">Min Age:</strong> {event.policies.attendeeMinAge}+</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agenda' && (
              <p className="text-sm text-text-secondary italic py-4">
                The agenda for this event hasn't been published yet. Check back closer to the event date.
              </p>
            )}

            {activeTab === 'venue' && (
              <div className="py-4">
                {event.format === 'virtual' ? (
                  <div className="text-sm text-text-secondary space-y-2">
                    <p className="text-text-primary font-medium">This is an online event.</p>
                    {event.onlineLink && (
                      <a
                        href={event.onlineLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-primary underline break-all"
                      >
                        {event.onlineLink}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-background rounded-xl p-4 border border-border text-sm text-text-secondary">
                    <p className="text-text-primary font-semibold mb-1">📍 Venue</p>
                    <p>{event.locationInfo}</p>
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

          {/* FAQs */}
          {event.faqs.length > 0 && (
            <section className="bg-surface p-8 rounded-2xl shadow-sm border border-border">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {event.faqs.map((faq, i) => (
                  <details key={i} className="group border border-border rounded-xl overflow-hidden">
                    <summary className="px-5 py-4 font-semibold text-text-primary cursor-pointer list-none flex items-center justify-between hover:bg-background transition">
                      {faq.question}
                      <svg className="w-4 h-4 text-text-secondary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-text-secondary bg-background">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Discussion */}
          <section className="bg-surface p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Discussion ({comments.length})
            </h2>

            <form onSubmit={submitComment} className="mb-8 flex gap-4 items-start">
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
              <div className="space-y-6">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-4 border-b border-border pb-6 last:border-0 last:pb-0">
                    <img src={comment.avatar} alt={comment.author} className="w-10 h-10 rounded-full shadow-sm" />
                    <div>
                      <h4 className="font-bold text-text-primary text-sm">{comment.author}</h4>
                      <p className="text-sm text-text-secondary mt-1 bg-background p-3 rounded-xl rounded-tl-none">
                        {comment.text}
                      </p>
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
                  <a
                    href={event.onlineLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline block mt-1 break-all"
                  >
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
            <h3 className="font-bold text-text-primary mb-3">Organized By</h3>
            <img
              src={event.organizer.logo}
              alt={event.organizer.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 shadow-sm"
            />
            <h4 className="font-bold text-lg text-text-primary">{event.organizer.name}</h4>
            <p className="text-sm text-text-secondary mb-4">{event.organizer.followers} Registered</p>
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="w-full bg-secondary text-white font-semibold py-2.5 rounded-lg hover:bg-secondary-hover transition"
            >
              Contact Organizer / Support
            </button>
          </div>

          {/* Sponsors */}
          {event.sponsors.length > 0 && (
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="font-bold text-text-primary mb-4">Sponsors</h3>
              <div className="space-y-3">
                {event.sponsors.map(name => (
                  <div key={name} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium text-text-primary">{name}</span>
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