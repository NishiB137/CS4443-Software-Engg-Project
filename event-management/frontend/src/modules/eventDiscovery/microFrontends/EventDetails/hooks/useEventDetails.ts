import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventApi, API_BASE_URL, type ApiEvent } from '@/services/api';
import { formatEventDate, getVenueDisplay, getOrganizerName } from '../../EventCatalog/hooks/UseEvents';

const likedStorageKey = (eventId: string) => `event_liked_${eventId}`;

type TicketingTier = {
  name: string;
  price: number;
  description?: string;
  capacity?: number;
};

type Pricing = { basePrice?: number };
type Sponsor = { name?: string };
type Analytics = { views?: number; likes?: number; bookmarks?: number; registrations?: number };
type PocDetails = { name?: string; email?: string; phone?: string };

// ─── Mapped shape used by the UI component ────────────────────────────────────
export interface EventSession {
  id: string;
  title: string;
  description: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  room: string;
  streamUrl: string;
  maxAttendees?: number;
  status: string;
  tags: string[];
  speakers: Array<{
    name?: string;
    designation?: string;
    organization?: string;
    bio?: string;
    topic?: string;
    avatarUrl?: string;
  }>;
}

export interface EventDetail {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  dateInfo: string;
  endDateInfo: string;
  locationInfo: string;
  onlineLink: string;
  format: string;
  registeredCount: string;
  views: string;
  likes: string;
  bookmarks: string;
  images: string[];
  tags: string[];
  isFree: boolean;
  tickets: Array<{
    id: string;
    type: string;
    price: number;
    desc: string;
    available: boolean;
  }>;
  organizer: {
    name: string;
    followers: string;
    logo: string;
  };
  // Point of contact
  pocDetails: {
    name: string;
    email: string;
    phone: string;
  };
  sponsors: string[];
  faqs: Array<{ question: string; answer: string }>;
  policies: {
    refundPolicy?: string;
    cancellationPolicy?: string;
    attendeeMinAge?: number;
  };
  sessions: EventSession[];
  status: string;
  visibility: string;
  timezone: string;
  maxCapacity?: number;
  _raw: ApiEvent;
}

const mapApiEventToDetail = (e: ApiEvent): Omit<EventDetail, 'sessions'> => {
  // Build images array
  const images: string[] = [];
  if (e.media?.videoUrl) images.push(e.media.videoUrl);
  if (e.coverImage)  images.push(e.coverImage);
  if (e.bannerImage && e.bannerImage !== e.coverImage) images.push(e.bannerImage);

  // Tags
  const rawTags = (e as unknown as { tags?: Array<{ name?: string } | string> }).tags ?? [];
  const tags = rawTags.map(t => (typeof t === 'string' ? t : (t.name ?? ''))).filter(Boolean);

  // Tickets from ticketingTiers
  const tiers = (e as unknown as { ticketingTiers?: TicketingTier[] }).ticketingTiers ?? [];
  const tickets = tiers.map((tier, i) => ({
    id:        `tier-${i}`,
    type:      tier.name,
    price:     tier.price,
    desc:      tier.description ?? (tier.capacity != null ? `Capacity: ${tier.capacity}` : 'Standard ticket'),
    available: (tier.capacity ?? 1) > 0,
  }));
  const pricing = (e as unknown as { pricing?: Pricing }).pricing;
  if (tickets.length === 0 && !e.isFree) {
    tickets.push({
      id: 'default', type: 'General Admission',
      price: pricing?.basePrice ?? 0, desc: 'Standard entry ticket', available: true,
    });
  }

  // Organizer
  const orgName = getOrganizerName(e);
  const orgObj  = e.organization && typeof e.organization === 'object' ? e.organization : null;
  const orgLogo = orgObj?.logo
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(orgName)}&background=2563EB&color=fff`;

  // POC
  const rawPoc = (e as unknown as { pocDetails?: PocDetails }).pocDetails;
  const pocDetails = {
    name:  rawPoc?.name  ?? '',
    email: rawPoc?.email ?? '',
    phone: rawPoc?.phone ?? '',
  };

  // Sponsors
  const sponsors = ((e as unknown as { sponsors?: Sponsor[] }).sponsors ?? [])
    .map(s => s?.name)
    .filter((n): n is string => Boolean(n));

  const rawFaqs = (e as unknown as { faqs?: Array<{ question?: string; answer?: string }> }).faqs;
  const faqs = Array.isArray(rawFaqs)
    ? rawFaqs
        .filter((f) => f && (String(f.question ?? '').trim() || String(f.answer ?? '').trim()))
        .map((f) => ({ question: String(f.question ?? ''), answer: String(f.answer ?? '') }))
    : [];

  // Location
  const v = e.venue;
  let locationInfo = getVenueDisplay(e);
  if (v?.address) locationInfo = [v.address, v.city, v.state, v.country].filter(Boolean).join(', ');

  const analytics        = (e as unknown as { analytics?: Analytics }).analytics;
  const registrationCount = (e as unknown as { registrationCount?: number }).registrationCount;

  return {
    id:               e._id,
    title:            e.title ?? 'Untitled Event',
    shortDescription: e.shortDescription ?? '',
    description:      e.description ?? 'No description provided.',
    dateInfo:         formatEventDate(e.startDate),
    endDateInfo:      formatEventDate(e.endDate),
    locationInfo,
    onlineLink:       v?.onlineLink ?? '',
    format:           e.format,
    registeredCount:  (analytics?.registrations ?? registrationCount ?? 0).toLocaleString(),
    views:            (analytics?.views ?? 0).toLocaleString(),
    likes:            (analytics?.likes ?? 0).toLocaleString(),
    bookmarks:        (analytics?.bookmarks ?? 0).toLocaleString(),
    images,
    tags,
    isFree:           e.isFree,
    tickets,
    organizer: {
      name:      orgName,
      followers: (analytics?.registrations ?? 0).toLocaleString(),
      logo:      orgLogo,
    },
    pocDetails,
    sponsors,
    faqs,
    policies:   (e.policies as EventDetail['policies']) ?? {},
    status:     e.status,
    visibility: e.visibility,
    timezone:   e.timezone,
    maxCapacity: e.maxCapacity,
    _raw:       e,
  };
};

// Map raw session API response to EventSession shape
const mapSession = (s: Record<string, unknown>): EventSession => {
  const st = s['startTime'];
  const et = s['endTime'];
  const startIso = st instanceof Date ? st.toISOString() : typeof st === 'string' ? st : '';
  const endIso = et instanceof Date ? et.toISOString() : typeof et === 'string' ? et : '';
  return {
    id:           String(s['_id'] ?? ''),
    title:        String(s['title'] ?? ''),
    description:  String(s['description'] ?? ''),
    sessionType:  String(s['sessionType'] ?? 'other'),
    startTime:    startIso,
    endTime:      endIso,
    room:         String(s['room'] ?? ''),
    streamUrl:    String(s['streamUrl'] ?? ''),
    maxAttendees: typeof s['maxAttendees'] === 'number' ? s['maxAttendees'] : undefined,
    status:       String(s['status'] ?? 'scheduled'),
    tags:         Array.isArray(s['tags']) ? (s['tags'] as string[]) : [],
    speakers:     Array.isArray(s['speakers'])
      ? (s['speakers'] as Array<Record<string, unknown>>).map(sp => ({
          name:         typeof sp['name']         === 'string' ? sp['name']         : undefined,
          designation:  typeof sp['designation']  === 'string' ? sp['designation']  : undefined,
          organization: typeof sp['organization'] === 'string' ? sp['organization'] : undefined,
          bio:          typeof sp['bio']          === 'string' ? sp['bio']          : undefined,
          topic:        typeof sp['topic']        === 'string' ? sp['topic']        : undefined,
          avatarUrl:    typeof sp['avatarUrl']    === 'string' ? sp['avatarUrl']    : undefined,
        }))
      : [],
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useEventDetails = () => {
  const [searchParams] = useSearchParams();
  const eventId   = searchParams.get('id')   ?? undefined;
  const eventSlug = searchParams.get('slug') ?? undefined;

  const [event, setEvent]     = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Interaction state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isLiked, setIsLiked]               = useState(false);
  const [likeBusy, setLikeBusy]           = useState(false);
  const [isBookmarked, setIsBookmarked]     = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [comments, setComments] = useState<Array<{
    id: string; author: string; text: string; avatar: string;
  }>>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!eventId && !eventSlug) {
        setError('No event ID or slug provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch event + sessions in parallel
        const eventRes = eventId
          ? await eventApi.getById(eventId)
          : await eventApi.getBySlug(eventSlug!);

        const resolvedId = eventRes.data._id;
        const embedded = (eventRes.data as ApiEvent & { sessions?: unknown[] }).sessions;

        let sessions: EventSession[] = [];
        if (Array.isArray(embedded) && embedded.length > 0) {
          sessions = embedded.map((s) => mapSession(s as Record<string, unknown>));
        } else {
          try {
            const sessionRes = await fetch(`${API_BASE_URL}/events/${resolvedId}/sessions`);
            if (sessionRes.ok) {
              const sessionJson = await sessionRes.json() as { success: boolean; data: unknown[] };
              if (sessionJson.success && Array.isArray(sessionJson.data)) {
                sessions = sessionJson.data.map((s) => mapSession(s as Record<string, unknown>));
              }
            }
          } catch {
            /* sessions optional */
          }
        }

        const detail = { ...mapApiEventToDetail(eventRes.data), sessions };
        setEvent(detail);
        if (typeof window !== 'undefined' && localStorage.getItem(likedStorageKey(detail.id))) {
          setIsLiked(true);
        }

        // View count increment
        if (typeof window !== 'undefined') {
          const viewedStorageKey = `event_viewed_${detail.id}`;
          if (!localStorage.getItem(viewedStorageKey)) {
            // First time viewing in this browser, increment view API
            eventApi.addView(detail.id).then(res => {
              if (res.success) {
                localStorage.setItem(viewedStorageKey, '1');
                setEvent(prev => prev ? { ...prev, views: res.views.toLocaleString() } : prev);
              }
            }).catch(() => { /* ignore */ });
          }
        }

        // Fetch comments
        try {
          const commentsRes = await eventApi.getComments(resolvedId);
          if (commentsRes.success && Array.isArray(commentsRes.data)) {
            setComments(commentsRes.data.map(c => ({
              id: c._id,
              author: c.userName,
              text: c.content,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=2563EB&color=fff`,
            })));
          }
        } catch (err) {
          console.error('Failed to fetch comments', err);
          setComments([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load event details';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [eventId, eventSlug]);

  const handleAddComment = async (text: string) => {
    if (!text.trim() || !event) return;
    try {
      const res = await eventApi.addComment(event.id, '', 'You', text);
      if (res.success && res.data) {
        setComments(prev => [{
          id:     res.data._id,
          author: res.data.userName,
          text:   res.data.content,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(res.data.userName)}&background=2563EB&color=fff`,
        }, ...prev]);
      }
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Failed to post comment');
    }
  };

  const toggleLike = useCallback(async () => {
    if (!event || likeBusy) return;
    if (typeof window !== 'undefined' && localStorage.getItem(likedStorageKey(event.id))) {
      setIsLiked(true);
      return;
    }
    setLikeBusy(true);
    try {
      const res = await eventApi.like(event.id) as { likes?: number };
      if (typeof window !== 'undefined') localStorage.setItem(likedStorageKey(event.id), '1');
      setIsLiked(true);
      setEvent((prev) => {
        if (!prev) return prev;
        const n = res.likes ?? (Number(prev.likes.replace(/,/g, '')) || 0);
        return { ...prev, likes: n.toLocaleString() };
      });
    } catch {
      /* ignore */
    } finally {
      setLikeBusy(false);
    }
  }, [event, likeBusy]);

  return {
    event, loading, error,
    isTicketModalOpen, setIsTicketModalOpen,
    isLiked, setIsLiked,
    likeBusy,
    toggleLike,
    isBookmarked, setIsBookmarked,
    selectedTicketId, setSelectedTicketId,
    comments, handleAddComment,
  };
};
