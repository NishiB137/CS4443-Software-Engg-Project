import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventApi, type ApiEvent } from '@/services/api';
import { formatEventDate, getVenueDisplay, getOrganizerName } from '../../EventCatalog/hooks/UseEvents';

// ─── Mapped shape used by the UI component ────────────────────────────────────
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
  sponsors: string[];
  faqs: Array<{ question: string; answer: string }>;
  policies: {
    refundPolicy?: string;
    cancellationPolicy?: string;
    attendeeMinAge?: number;
  };
  status: string;
  visibility: string;
  timezone: string;
  maxCapacity?: number;
  _raw: ApiEvent;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80',
];

type TicketingTier = {
  name: string;
  price: number;
  description?: string;
  capacity?: number;
};

type Pricing = { basePrice?: number };

type Sponsor = { name: string };

type Analytics = { views?: number; likes?: number; bookmarks?: number; registrations?: number };

const mapApiEventToDetail = (e: ApiEvent): EventDetail => {
  // Build images array: prefer real images from the event, pad with fallbacks
  const images: string[] = [];
  if (e.coverImage) images.push(e.coverImage);
  if (e.bannerImage && e.bannerImage !== e.coverImage) images.push(e.bannerImage);
  while (images.length < 3) images.push(FALLBACK_IMAGES[images.length] ?? FALLBACK_IMAGES[0]!);

  // Tags: backend may send populated objects or raw IDs
  const rawTags = (e as unknown as { tags?: Array<{ name?: string } | string> }).tags ?? [];
  const tags = rawTags.map((t) => (typeof t === 'string' ? t : (t.name ?? ''))).filter(Boolean);

  // Tickets from ticketingTiers (may not exist in ApiEvent typing yet)
  const tiers = (e as unknown as { ticketingTiers?: TicketingTier[] }).ticketingTiers ?? [];
  const tickets = tiers.map((tier, i) => ({
    id:        `tier-${i}`,
    type:      tier.name,
    price:     tier.price,
    desc:      tier.description ?? `Capacity: ${tier.capacity}`,
    available: (tier.capacity ?? 0) > 0,
  }));

  // If no tiers, synthesise one from pricing
  const pricing = (e as unknown as { pricing?: Pricing }).pricing;
  if (tickets.length === 0 && !e.isFree) {
    tickets.push({
      id:        'default',
      type:      'General Admission',
      price:     pricing?.basePrice ?? 0,
      desc:      'Standard entry ticket',
      available: true,
    });
  }

  // Organizer
  const orgName = getOrganizerName(e);
  const orgLogo = typeof e.organization === 'object' && e.organization.logo
    ? e.organization.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(orgName)}&background=2563EB&color=fff`;

  // Sponsors (may not exist in ApiEvent typing yet)
  const sponsors = ((e as unknown as { sponsors?: Sponsor[] }).sponsors ?? []).map((s) => s.name);

  // Location display
  const v = e.venue;
  let locationInfo = getVenueDisplay(e);
  if (v?.address) locationInfo = [v.address, v.city, v.state, v.country].filter(Boolean).join(', ');

  const analytics = (e as unknown as { analytics?: Analytics }).analytics;
  const registrationCount = (e as unknown as { registrationCount?: number }).registrationCount;

  return {
    id:               e._id,
    title:            e.title,
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
    sponsors,
    faqs:       e.faqs ?? [],
    policies:   (e.policies as EventDetail['policies']) ?? {},
    status:     e.status,
    visibility: e.visibility,
    timezone:   e.timezone,
    maxCapacity: e.maxCapacity,
    _raw:       e,
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useEventDetails = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') ?? undefined;
  const eventSlug = searchParams.get('slug') ?? undefined;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [comments, setComments] = useState<Array<{ id: number; author: string; text: string; avatar: string }>>([]);

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
        const res = eventId
          ? await eventApi.getById(eventId)
          : await eventApi.getBySlug(eventSlug!);

        setEvent(mapApiEventToDetail(res.data));
        setComments([]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load event details';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [eventId, eventSlug]);

  const handleAddComment = (text: string) => {
    if (!text.trim()) return;
    setComments(prev => [{
      id: Date.now(),
      author: 'You',
      text,
      avatar: 'https://ui-avatars.com/api/?name=You&background=2563EB&color=fff',
    }, ...prev]);
  };

  return {
    event, loading, error,
    isTicketModalOpen, setIsTicketModalOpen,
    isLiked, setIsLiked,
    isBookmarked, setIsBookmarked,
    selectedTicketId, setSelectedTicketId,
    comments, handleAddComment,
  };
};