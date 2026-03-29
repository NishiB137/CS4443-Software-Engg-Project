// Shared request/response types for the event controller

export interface CreateEventBody {
  title: string;
  shortDescription?: string;
  description?: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
  notes?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  maxCapacity?: number;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    onlineLink?: string;
  };
  visibility: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';
  status?: 'draft' | 'published';
  tags?: string[];
  coverImage?: string;
  bannerImage?: string;
  organizerName?: string;
  pocDetails?: { name: string; email: string; phone?: string };
  policies?: {
    refundPolicy?: string;
    cancellationPolicy?: string;
    privacyPolicy?: string;
    termsAndConditions?: string;
    attendeeMinAge?: number;
    codeOfConduct?: string;
  };
  pricing?: { basePrice: number; discountPercentage: number };
  faqs?: Array<{ question: string; answer: string }>;

  // Template + dynamic fields
  templateId?: string;
  customFields?: Array<{ key: string; label: string; value: unknown }>;
  sessions?: Array<{
    title: string;
    description?: string;
    notes?: string;
    sessionType?: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    room?: string;
    streamUrl?: string;
    maxAttendees?: number;
    speakers?: Array<{
      name?: string;
      bio?: string;
      designation?: string;
      organization?: string;
      avatarUrl?: string;
      topic?: string;
    }>;
    tags?: string[];
    order?: number;
  }>;

  // For dev/sprint-2: org and user are passed directly (no auth yet)
  organization: string;
  createdBy: string;
}

export interface UpdateEventBody extends Partial<CreateEventBody> {}

export interface EventStatusBody {
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';
}
