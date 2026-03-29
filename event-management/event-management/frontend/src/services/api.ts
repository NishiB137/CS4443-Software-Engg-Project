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
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';
  visibility: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';
  maxCapacity?: number;
  coverImage?: string;
  bannerImage?: string;
  organizerName?: string;
  organization: { _id: string; name: string; slug: string; logo?: string } | string;
  createdBy: { _id: string; name: string; email: string } | string;
  tags?: Array<{ _id: string; name: string; slug: string }>;
  analytics: { likes: number; bookmarks: number; views: number; registrations: number };
  policies?: Record<string, unknown>;
  faqs?: Array<{ question: string; answer: string }>;
  /** Present on GET /events/:id and /slug/:slug when sessions are embedded */
  sessions?: unknown[];
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
  status?: 'draft' | 'published';
  coverImage?: string;
  organizerName?: string;
  policies?: Record<string, unknown>;
  faqs?: Array<{ question: string; answer: string }>;
  // Sprint 2: passed directly until auth is wired up
  organization?: string;
  createdBy?: string;
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

  getComments: (eventId: string) =>
    request<{ success: boolean; data: ApiComment[] }>(`/events/${eventId}/comments`),

  addComment: (eventId: string, userId: string, userName: string, content: string) =>
    request<{ success: boolean; data: ApiComment }>(`/events/${eventId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName, content }),
    }),
};

// ─── Template types ───────────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime'
  | 'select' | 'multiselect' | 'toggle' | 'url' | 'email' | 'phone';

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

export interface TemplateListResponse  { success: boolean; data: ApiTemplate[] }
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
