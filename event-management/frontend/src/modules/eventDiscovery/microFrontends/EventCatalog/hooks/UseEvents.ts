import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { eventApi, type ApiEvent } from '@/services/api';

export const getVenueDisplay = (event: ApiEvent): string => {
  const v = event.venue;
  if (!v) return event.format === 'virtual' ? 'Online' : 'TBD';
  if (event.format === 'virtual') return v.onlineLink ? 'Online Event' : 'Online';
  const parts = [v.name, v.city, v.state].filter(Boolean);
  return parts.join(', ') || 'TBD';
};

export const getPriceDisplay = (event: ApiEvent): number | string | 'Free' => {
  if (event.isFree) return 'Free';
  if (event.ticketingTiers && event.ticketingTiers.length > 0) {
    const prices = event.ticketingTiers.map(t => t.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice !== maxPrice) {
      return `${minPrice} - ${maxPrice}`;
    }
    return minPrice;
  }
  return event.pricing?.basePrice ?? 0;
};

export const getUserTimezone = (): string => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

export const getDynamicTimezoneAbbreviation = (date: Date, tz: string): string => {
  try {
    const shortFallback = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value || '';

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long',
    }).formatToParts(date);
    
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value;
    if (tzPart) {
      if (tzPart.includes('GMT') || tzPart.includes('UTC')) return shortFallback;
      const abbr = tzPart.split(/[- ]/).map(w => w[0]).join('').toUpperCase();
      if (!shortFallback.includes('GMT') && /^[A-Z]{3,4}$/.test(shortFallback)) {
          return shortFallback;
      }
      return abbr;
    }
    return shortFallback;
  } catch {
    return '';
  }
};

export const formatEventDate = (isoDate: string, eventTz?: string): string => {
  try {
    if (!isoDate) return '';
    const userTz = getUserTimezone();
    const tz = eventTz || 'UTC';
    const date = new Date(isoDate);

    // Use consistent config for both
    const fmtOpts: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    };

    const localFormatted = new Intl.DateTimeFormat('en-US', { ...fmtOpts, timeZone: userTz }).format(date);
    const localAbbr = getDynamicTimezoneAbbreviation(date, userTz);
    const localStr = `${localFormatted} ${localAbbr}`;
    
    if (tz !== userTz) {
      const eventFormatted = new Intl.DateTimeFormat('en-US', { ...fmtOpts, timeZone: tz }).format(date);
      const eventAbbr = getDynamicTimezoneAbbreviation(date, tz);
      const eventStr = `${eventFormatted} ${eventAbbr}`;
      
      // Only append if the generated representation evaluates differently
      if (localStr !== eventStr) {
          return `${localStr} (${eventStr})`;
      }
    }
    
    return localStr;
  } catch {
    return String(isoDate);
  }
};

export const getOrganizerName = (event: ApiEvent): string => {
  if (event.organizerName) return event.organizerName;
  if (typeof event.organization === 'object') return event.organization.name;
  return 'Eventa';
};

export const getCategoryLabel = (event: ApiEvent): string => {
  const map: Record<string, string> = {
    conference: 'Tech', workshop: 'Education', hackathon: 'Tech',
    concert: 'Music', exhibition: 'Art', summit: 'Business',
    festival: 'Music', competition: 'Sports', webinar: 'Tech', other: 'General',
  };
  return map[event.eventType] ?? 'General';
};

export interface CatalogEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number | string | 'Free';
  currency: string;
  images: string[];
  category: string;
  organization: string;
  isTrending: boolean;
  slug: string;
  _raw: ApiEvent;
}

const FALLBACK_IMAGES: Record<string, string> = {
  conference:  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  workshop:    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
  hackathon:   'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  concert:     'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
  exhibition:  'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80',
  summit:      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
  festival:    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  webinar:     'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80',
};

const getFallback = (eventType: string) =>
  FALLBACK_IMAGES[eventType] ?? 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';

const mapEvent = (e: ApiEvent): CatalogEvent => ({
  id:           e._id,
  title:        e.title,
  date:         formatEventDate(e.startDate, e.timezone),
  location:     getVenueDisplay(e),
  price:        getPriceDisplay(e),
  currency:     (e as unknown as { currency?: string }).currency || 'USD',
  images:       [
    e.coverImage,
    ...((e as any).secondaryImages || [])
  ].filter(Boolean).length > 0 
    ? [e.coverImage, ...((e as any).secondaryImages || [])].filter(Boolean) as string[]
    : [getFallback(e.eventType)],
  category:     getCategoryLabel(e),
  organization: getOrganizerName(e),
  isTrending:   (e.analytics?.views ?? 0) > 500 || (e.analytics?.registrations ?? 0) > 100,
  slug:         e.slug,
  _raw:         e,
});

export const useEvents = () => {
  const [events, setEvents]       = useState<CatalogEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filterType, setFilterType]     = useState<'All' | 'Free' | 'Paid'>('All');
  const [category, setCategory]         = useState('All');
  /** '' | physical | virtual | hybrid */
  const [formatFilter, setFormatFilter] = useState('');
  /** yyyy-mm-dd */
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo]     = useState('');
  /** empty = any; number = suitable for attendees of at least this age */
  const [suitableForAge, setSuitableForAge] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);

  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam !== null) {
      setGlobalSearch(searchParam);
    } else {
      setGlobalSearch('');
    }
  }, [location.search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page:  String(currentPage),
        limit: '9',
        status: 'published',
        visibility: 'public',
      };
      
      const activeSearch = globalSearch.trim();
      if (activeSearch)        params['search']     = activeSearch;
      if (filterType === 'Free')     params['isFree']     = 'true';
      if (filterType === 'Paid')     params['isFree']     = 'false';
      if (category !== 'All')       params['category']   = category;
      if (formatFilter)             params['format']     = formatFilter;
      if (startDateFrom.trim())     params['startDateFrom'] = new Date(startDateFrom).toISOString();
      if (startDateTo.trim())       params['startDateTo']   = new Date(startDateTo + 'T23:59:59.999').toISOString();
      if (suitableForAge.trim() !== '') {
        const n = Number(suitableForAge);
        if (!Number.isNaN(n)) params['suitableForAge'] = String(Math.min(120, Math.max(0, n)));
      }
      if (tagFilter.trim()) params['tag'] = tagFilter.trim();

      const res = await eventApi.list(params);

      const mapped = res.events.map(mapEvent);

      setEvents(mapped);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load events';
      setError(msg);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [globalSearch, filterType, category, formatFilter, startDateFrom, startDateTo, suitableForAge, tagFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, globalSearch ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchEvents, globalSearch]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, filterType, category, formatFilter, startDateFrom, startDateTo, suitableForAge, tagFilter]);

  return {
    events, loading, error,
    searchQuery: globalSearch,
    filterType, setFilterType,
    category, setCategory,
    formatFilter, setFormatFilter,
    startDateFrom, setStartDateFrom,
    startDateTo, setStartDateTo,
    suitableForAge, setSuitableForAge,
    tagFilter, setTagFilter,
    currentPage, setCurrentPage, totalPages,
    refetch: fetchEvents,
  };
};