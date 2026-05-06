// Central API service – all backend calls go through here.
// Base URL picks up the Vite proxy in dev, and env var in production.

const BASE_URL = import.meta.env['VITE_API_URL'] as string | undefined ?? '/api';
export const API_BASE_URL = BASE_URL;

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json = await res.json() as { success: boolean; message?: string } & T;

  if (!res.ok || !json.success) {
    throw new Error((json as { message?: string }).message ?? `Request failed: ${res.status}`);
  }

  return json;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiEvent {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
  currency?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    onlineLink?: string;
  };
  status: 'draft' | 'review' | 'approved' | 'published' | 'ongoing' | 'completed' | 'archived';
  visibility: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';
  maxCapacity?: number;
  coverImage?: string;
  bannerImage?: string;
  secondaryImages?: string[];
  media?: { videoUrl?: string; logo?: string };
  organizerName?: string;
  notes?: string;
  pocDetails?: { name?: string; email?: string; phone?: string };
  organization: { _id: string; name: string; slug: string; logo?: string } | string;
  createdBy: { _id: string; name: string; email: string } | string;
  team?: Array<{ user: { _id: string; username: string; name: string; email: string } | string; role: string; assignedAt: string }>;
  tags?: Array<{ _id: string; name: string; slug: string }>;
  pricing?: { basePrice: number; discountPercentage: number };
  ticketingTiers?: Array<{ name: string; price: number; capacity: number; duration?: string; description?: string }>;
  analytics: { likes: number; bookmarks: number; views: number; registrations: number };
  policies?: Record<string, unknown>;
  faqs?: Array<{ question: string; answer: string }>;
  /** Present on GET /events/:id and /slug/:slug when sessions are embedded */
  sessions?: unknown[];
  customEventType?: string;
  customFields?: Array<{ key: string; label: string; value: unknown }>;
  registrationFields?: Array<{
    key: string;
    label: string;
    fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
    category?: string;
  }>;
  templateId?: string;
  entrySettings?: {
    enableAttendanceManagement: boolean;
    scannerType: 'qr' | 'none';
    requireSpecificTime: boolean;
    entryStartTime?: string;
    entryEndTime?: string;
  };
  requiresRegistration?: boolean;
  requiresReview?: boolean;
  reviewer?: string | { _id: string; username: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiComment {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  content: string;
  likes: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  shortDescription?: string;
  description?: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
  currency?: string;
  ticketingTiers?: Array<{ name: string; price: number; capacity: number; description?: string }>;
  tags?: string[];

  notes?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  maxCapacity?: number;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    onlineLink?: string;
  };
  visibility: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';
  status?: 'draft' | 'review' | 'approved' | 'published' | 'ongoing' | 'completed' | 'archived';
  coverImage?: string;
  bannerImage?: string;
  secondaryImages?: string[];
  media?: { videoUrl?: string; logo?: string };
  organizerName?: string;
  policies?: Record<string, unknown>;
  faqs?: Array<{ question: string; answer: string }>;
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
  // Sprint 2: passed directly until auth is wired up
  organization?: string;
  createdBy?: string;
  team?: Array<{ user: string; role: string }>;
  /** Whether this event needs a review before publishing */
  requiresReview?: boolean;
  /** The ObjectId of the reviewer (must be a team member) */
  reviewer?: string;
}

export interface ListEventsResponse {
  success: boolean;
  events: ApiEvent[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface SingleEventResponse {
  success: boolean;
  data: ApiEvent;
}

// ─── Event API calls ──────────────────────────────────────────────────────────

export const eventApi = {
  create: (payload: CreateEventPayload) =>
    request<SingleEventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<ListEventsResponse>(`/events${qs}`);
  },

  getTimezones: () => request<{ success: boolean; data: string[] }>('/events/timezones'),

  getById: (id: string) =>
    request<SingleEventResponse>(`/events/${id}`),

  getBySlug: (slug: string) =>
    request<SingleEventResponse>(`/events/slug/${slug}`),

  update: (id: string, payload: Partial<CreateEventPayload>) =>
    request<SingleEventResponse>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  publish: (id: string) =>
    request<SingleEventResponse>(`/events/${id}/publish`, { method: 'PATCH' }),

  archive: (id: string) =>
    request<SingleEventResponse>(`/events/${id}/archive`, { method: 'PATCH' }),

  changeStatus: (id: string, status: string) =>
    request<SingleEventResponse>(`/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/events/${id}`, { method: 'DELETE' }),

  getChangelog: (id: string) =>
    request<{ success: boolean; data: unknown[] }>(`/events/${id}/changelog`),

  /** Increment server-side like counter (idempotent per browser via localStorage in UI) */
  like: (id: string) =>
    request<{ success: boolean; likes: number }>(`/events/${id}/like`, { method: 'POST' }),

  unlike: (id: string) =>
    request<{ success: boolean; likes: number }>(`/events/${id}/unlike`, { method: 'POST' }),

  /** Increment server-side view counter (idempotent per browser via localStorage in UI) */
  addView: (id: string) =>
    request<{ success: boolean; views: number }>(`/events/${id}/view`, { method: 'POST' }),

  getComments: (eventId: string) =>
    request<{ success: boolean; data: ApiComment[] }>(`/events/${eventId}/comments`),

  addComment: (eventId: string, userId: string, userName: string, content: string) =>
    request<{ success: boolean; data: ApiComment }>(`/events/${eventId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName, content }),
    }),

  approve: (id: string, changedBy?: string) =>
    request<SingleEventResponse>(`/events/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ changedBy }),
    }),

  reject: (id: string, changedBy?: string, reason?: string) =>
    request<SingleEventResponse>(`/events/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ changedBy, reason }),
    }),

  listPendingReview: (reviewerId?: string) => {
    const qs = reviewerId ? `?reviewerId=${encodeURIComponent(reviewerId)}` : '';
    return request<{ success: boolean; data: ApiEvent[] }>(`/events/pending-review${qs}`);
  },

  getRecommendations: (userId?: string) => {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request<{ success: boolean; forYou: ApiEvent[]; trending: ApiEvent[]; viewedEventTypes: string[] }>(`/events/recommendations${qs}`);
  },
};


// ─── Template types ───────────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime'
  | 'select' | 'multiselect' | 'toggle' | 'url' | 'email' | 'phone' | 'speakers' | 'file_image' | 'file_video' | 'file_image_multiple';

export type FieldSection = 'basics' | 'datetime' | 'venue' | 'capacity' | 'policies' | 'media' | 'custom';

export interface FieldSpec {
  key: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  section: FieldSection;
  order: number;
  form?: string;
  category?: string;
  formOrder?: number;
  categoryOrder?: number;
}

export interface SessionTemplate {
  title: string;
  sessionType: string;
  defaultDurationMinutes: number;
  description?: string;
  defaultFields: FieldSpec[];
  layout?: TemplateLayout;
}

export interface TemplateLayoutCategory {
  name: string;
  order: number;
}

export interface TemplateLayoutForm {
  name: string;
  order: number;
  categories: TemplateLayoutCategory[];
}

export interface TemplateLayout {
  forms: TemplateLayoutForm[];
}

export interface ApiTemplate {
  _id: string;
  name: string;
  description: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
  defaultCurrency?: string;
  defaultTicketingTiers?: Array<{ name: string; price: number; capacity: number; description?: string }>;
  requiresRegistration?: boolean;
  defaultRegistrationFields?: Array<{
    key: string;
    label: string;
    fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
    category?: string;
    categoryOrder?: number;
    order?: number;
  }>;
  isDefault: boolean;
  isSystemTemplate: boolean;
  coverColor: string;
  tags: string[];
  fields: FieldSpec[];
  sessionTemplates: SessionTemplate[];
  layout?: TemplateLayout;
  defaultVisibility: string;
  defaultStatus: string;
  defaultPolicies: { refundPolicy?: string; cancellationPolicy?: string; attendeeMinAge?: number };
  defaultEntrySettings?: {
    enableAttendanceManagement: boolean;
    scannerType: 'qr' | 'none';
    requireSpecificTime: boolean;
  };
  allowsSubEvents: boolean;
  maxSubEventDepth: number;
  usageCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFiltersResponse {
  success: boolean;
  data: {
    kinds: Array<{ value: 'all' | 'default' | 'custom'; label: string; count: number }>;
    eventTypes: Array<{ value: string; label: string; count: number }>;
    formats: Array<{ value: string; label: string; count: number }>;
    tags: Array<{ value: string; label: string; count: number }>;
  };
}

export interface TemplateListResponse { success: boolean; data: ApiTemplate[] }
export interface TemplateSingleResponse { success: boolean; data: ApiTemplate }

// ─── Template API calls ───────────────────────────────────────────────────────

export const templateApi = {
  list: (params?: {
    isDefault?: boolean; // back-compat
    kind?: 'all' | 'default' | 'custom';
    eventType?: string;
    format?: string;
    tag?: string;
    q?: string;
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return request<TemplateListResponse>(`/templates${qs}`);
  },

  filters: () => request<TemplateFiltersResponse>('/templates/filters'),

  getById: (id: string) => request<TemplateSingleResponse>(`/templates/${id}`),

  create: (payload: Partial<ApiTemplate>) =>
    request<TemplateSingleResponse>('/templates', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<ApiTemplate>) =>
    request<TemplateSingleResponse>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/templates/${id}`, { method: 'DELETE' }),

  duplicate: (id: string, name: string) =>
    request<TemplateSingleResponse>(`/templates/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ name }) }),

  use: (id: string) =>
    request<{ success: boolean }>(`/templates/${id}/use`, { method: 'POST' }),
};

// ─── Direct Upload API (Bypasses JSON request wrapper) ────────────────────────
export const uploadApi = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Upload failed');
    return json.url;
  },
};

// ─── Registration types ───────────────────────────────────────────────────────

export interface ApiRegistration {
  _id: string;
  eventId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  ticketTier: string;
  amountPaid: number;
  paymentStatus: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  formResponses: Record<string, unknown>;
  registrationDate: string;
  createdAt: string;
  checkedIn?: boolean;
  checkedInAt?: string[];
  checkedOut?: boolean;
  checkedOutAt?: string[];
  checkInCount?: number;
  qrToken?: string;
}

export interface RegisterPayload {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  ticketTier?: string;
  formResponses?: Record<string, unknown>;
}

// ─── Registration API calls ───────────────────────────────────────────────────

export const registrationApi = {
  register: (eventId: string, payload: RegisterPayload) =>
    request<{ success: boolean; data: ApiRegistration; newAccount?: { _id: string; username: string; email: string; name: string; isGuest: boolean } | null }>(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  check: (eventId: string, email: string) =>
    request<{ success: boolean; registered: boolean; data: ApiRegistration | null }>(
      `/events/${eventId}/registrations/check?email=${encodeURIComponent(email)}`
    ),

  list: (eventId: string) =>
    request<{ success: boolean; data: ApiRegistration[]; count: number; capacity: number | null }>(
      `/events/${eventId}/registrations`
    ),

  cancel: (eventId: string, regId: string) =>
    request<{ success: boolean; data: ApiRegistration }>(`/events/${eventId}/registrations/${regId}`, {
      method: 'DELETE',
    }),

  getMyRegistrations: (email: string) =>
    request<{ success: boolean; data: ApiRegistration[] }>(`/user/registrations?email=${encodeURIComponent(email)}`),

  /** Check-in via QR scan */
  checkIn: (eventId: string, qrToken: string) =>
    request<{ success: boolean; data: ApiRegistration; message: string }>(`/events/${eventId}/validate-qr`, {
      method: 'POST',
      body: JSON.stringify({ qrToken }),
    }),

  /** Manual check-out by registration ID (organizer action, no QR required) */
  checkOut: (eventId: string, regId: string) =>
    request<{ success: boolean; data: ApiRegistration; message: string }>(`/events/${eventId}/registrations/${regId}/checkout`, {
      method: 'POST',
    }),
};

// ─── Bookmark API calls ───────────────────────────────────────────────────────

export interface BookmarkToggleResponse { success: boolean; bookmarked: boolean }
export interface BookmarkListResponse { success: boolean; data: ApiEvent[]; count: number }
export interface BookmarkCheckResponse { success: boolean; bookmarked: boolean }

export const bookmarkApi = {
  toggle: (eventId: string) =>
    request<BookmarkToggleResponse>(`/bookmarks/${eventId}`, { method: 'POST' }),

  check: (eventId: string) =>
    request<BookmarkCheckResponse>(`/bookmarks/check/${eventId}`, { method: 'POST' }),

  list: () =>
    request<BookmarkListResponse>('/bookmarks'),
};

// ─── Save as Template ─────────────────────────────────────────────────────────

export const saveAsTemplate = (eventId: string, name?: string) =>
  request<TemplateSingleResponse>(`/events/${eventId}/save-as-template`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

// ─── Support Ticket API calls ─────────────────────────────────────────────────

export interface ApiSupportTicket {
  _id: string;
  event: string;
  raisedBy: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export const supportTicketApi = {
  create: (payload: { event: string; raisedBy: string; subject: string; message: string }) =>
    request<{ success: boolean; data: ApiSupportTicket }>('/support-tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listByEvent: (eventId: string) =>
    request<{ success: boolean; data: ApiSupportTicket[] }>(`/support-tickets/event/${eventId}`),

  listByEmail: (email: string) =>
    request<{ success: boolean; data: ApiSupportTicket[] }>(`/support-tickets/user/${encodeURIComponent(email)}`),

  resolve: (id: string) =>
    request<{ success: boolean; data: ApiSupportTicket }>(`/support-tickets/${id}/resolve`, { method: 'PATCH' }),
};

// ─── Auth API calls ───────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  isGuest?: boolean;
}

export const authApi = {
  signup: (username: string, email: string, name?: string) =>
    request<{ success: boolean; data: AuthUser }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, name: name || username }),
    }),

  login: (username: string) =>
    request<{ success: boolean; data: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  checkUsername: (username: string) =>
    request<{ success: boolean; available: boolean }>(`/auth/check-username?username=${encodeURIComponent(username)}`),

  getUserByUsername: (username: string) =>
    request<{ success: boolean; data: { _id: string; username: string; name: string; email: string; role: string } }>(
      `/auth/user-by-username?username=${encodeURIComponent(username)}`
    ),
};
