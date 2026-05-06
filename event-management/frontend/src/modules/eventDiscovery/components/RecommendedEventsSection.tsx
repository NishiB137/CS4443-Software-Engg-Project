import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi, type ApiEvent } from '@/services/api';
import { formatEventDate, getPriceDisplay, getVenueDisplay, getCategoryLabel } from '@/modules/eventDiscovery/microFrontends/EventCatalog/hooks/UseEvents';

const FALLBACK_IMGS: Record<string, string> = {
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=75',
  hackathon:  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=75',
  concert:    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=75',
  workshop:   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=75',
  festival:   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=75',
  webinar:    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=600&q=75',
};
const getFallback = (type: string) => FALLBACK_IMGS[type] ?? FALLBACK_IMGS['conference'];

const CATEGORY_COLORS: Record<string, string> = {
  Tech: 'bg-blue-100 text-blue-700',
  Music: 'bg-purple-100 text-purple-700',
  Education: 'bg-amber-100 text-amber-700',
  Sports: 'bg-green-100 text-green-700',
  Art: 'bg-pink-100 text-pink-700',
  Business: 'bg-indigo-100 text-indigo-700',
  General: 'bg-gray-100 text-gray-600',
};

interface EventCardSmallProps {
  event: ApiEvent;
}

const EventCardSmall: React.FC<EventCardSmallProps> = ({ event }) => {
  const navigate = useNavigate();
  const img = event.coverImage || getFallback(event.eventType);
  const price = getPriceDisplay(event);
  const venue = getVenueDisplay(event);
  const cat = getCategoryLabel(event);
  const dateStr = formatEventDate(event.startDate, event.timezone);

  return (
    <button
      type="button"
      onClick={() => navigate(`/event?slug=${event.slug}`)}
      className="group flex-shrink-0 w-64 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left"
    >
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        <img
          src={img}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = getFallback(event.eventType); }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['General']}`}>
          {cat}
        </span>
        {price === 'Free' ? (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">FREE</span>
        ) : (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-gray-800 px-2 py-0.5 rounded-full">
            {event.currency === 'INR' ? '₹' : event.currency === 'EUR' ? '€' : '$'}{price}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-black text-sm text-gray-900 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">{event.title}</h3>
        <p className="text-[11px] text-gray-500 truncate">{dateStr}</p>
        <p className="text-[11px] text-gray-400 truncate">{venue}</p>
      </div>
    </button>
  );
};

interface HorizontalRowProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  events: ApiEvent[];
  loading?: boolean;
  accentClass?: string;
}

const HorizontalRow: React.FC<HorizontalRowProps> = ({ title, subtitle, icon, events, loading, accentClass = 'from-indigo-600 to-purple-600' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
    }
  };

  if (!loading && events.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accentClass} flex items-center justify-center text-white shadow-md`}>
              {icon}
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700 transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700 transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable row */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 h-52 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {events.map((ev) => (
              <EventCardSmall key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const RecommendedEventsSection: React.FC = () => {
  const [forYou, setForYou] = useState<ApiEvent[]>([]);
  const [trending, setTrending] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId') ?? undefined;
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await eventApi.getRecommendations(userId);
        if (!cancelled) {
          setForYou(res.forYou || []);
          setTrending(res.trending || []);
        }
      } catch {
        // silently fail — catalog still loads below
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const hasAny = loading || forYou.length > 0 || trending.length > 0;
  if (!hasAny) return null;

  return (
    <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
      {/* For You */}
      {isLoggedIn && (loading || forYou.length > 0) && (
        <HorizontalRow
          title="Recommended For You"
          subtitle="Based on your interests and activity"
          accentClass="from-violet-500 to-indigo-600"
          loading={loading}
          events={forYou}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          }
        />
      )}

      {/* Trending */}
      {(loading || trending.length > 0) && (
        <HorizontalRow
          title="Trending Now"
          subtitle="Most viewed upcoming events"
          accentClass="from-orange-500 to-amber-500"
          loading={loading}
          events={trending}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          }
        />
      )}
    </div>
  );
};
