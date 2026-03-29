import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import mongoose from 'mongoose';
import { Tag } from '../models/Tag.js';
import { validateSessionBody } from './sessionService.js';

/** UI category chips → eventType values (must match frontend UseEvents / Landing) */
export const CATEGORY_EVENT_TYPES: Record<string, string[]> = {
  Music: ['concert', 'festival'],
  Tech: ['conference', 'hackathon', 'webinar'],
  Sports: ['competition'],
  Education: ['workshop'],
  Art: ['exhibition'],
  Business: ['summit'],
  General: ['other'],
};

async function attachSessions(eventLean: Record<string, unknown> | null) {
  if (!eventLean || !eventLean['_id']) return eventLean;
  const id = String(eventLean['_id']);
  const sessions = await Session.find({ event: id }).sort({ order: 1, startTime: 1 }).lean();
  return { ...eventLean, sessions };
}
import { generateSlug } from '../utils/slug.js';
import type { CreateEventBody, UpdateEventBody } from '../types/event.types.js';

// ─── Validation limits (single source of truth) ───────────────────────────────

const LIMITS = {
  title:              { min: 3,  max: 150 },
  shortDescription:   { max: 300 },
  description:        { min: 20, max: 10_000 },
  maxCapacity:        { min: 1,  max: 1_000_000 },
  attendeeMinAge:     { min: 0,  max: 120 },
  cancellationPolicy: { max: 2_000 },
  venueField:         { max: 200 },
};

const isValidUrl = (url: string) => /^https?:\/\/.+/.test(url);

// ─── Safe ISO date parser ─────────────────────────────────────────────────────
// Returns null if the string is not a real, non-epoch date.
const parseDate = (raw: unknown): Date | null => {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  // Reject epoch (the JS default for invalid/empty datetime-local → ISO conversion)
  if (d.getFullYear() < 2000) return null;
  return d;
};

// ─── Full create validation ───────────────────────────────────────────────────

const validateCreateBody = (body: CreateEventBody): void => {
  const errors: string[] = [];

  const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

  // ── Title ──
  const title = asString(body.title);
  if (!title.trim())
    errors.push('Event name is required.');
  else if (title.trim().length < LIMITS.title.min)
    errors.push(`Event name must be at least ${LIMITS.title.min} characters.`);
  else if (title.trim().length > LIMITS.title.max)
    errors.push(`Event name cannot exceed ${LIMITS.title.max} characters.`);

  // ── Short description ──
  const shortDescription = asString(body.shortDescription);
  if (shortDescription && shortDescription.length > LIMITS.shortDescription.max)
    errors.push(`Short description cannot exceed ${LIMITS.shortDescription.max} characters.`);

  // ── Full description — ALWAYS required, not optional ──
  const description = asString(body.description);
  if (!description.trim())
    errors.push('Event description is required.');
  else if (description.trim().length < LIMITS.description.min)
    errors.push(`Description must be at least ${LIMITS.description.min} characters.`);
  else if (description.length > LIMITS.description.max)
    errors.push(`Description cannot exceed ${LIMITS.description.max.toLocaleString()} characters.`);

  // ── Dates — must be present, parseable, non-epoch, and ordered ──
  const start = parseDate(body.startDate);
  const end   = parseDate(body.endDate);

  if (!asString(body.startDate).trim()) errors.push('Start date is required.');
  else if (!start)             errors.push('Start date is not a valid date.');

  if (!asString(body.endDate).trim())   errors.push('End date is required.');
  else if (!end)               errors.push('End date is not a valid date.');

  if (start && end && end <= start)
    errors.push('End date/time must be after start date/time.');

  // ── Capacity ──
  if (body.maxCapacity !== undefined && body.maxCapacity !== null) {
    const cap = Number(body.maxCapacity);
    if (!Number.isInteger(cap) || cap < LIMITS.maxCapacity.min)
      errors.push(`Maximum capacity must be a whole number ≥ ${LIMITS.maxCapacity.min}.`);
    else if (cap > LIMITS.maxCapacity.max)
      errors.push(`Maximum capacity cannot exceed ${LIMITS.maxCapacity.max.toLocaleString()}.`);
  }

  // ── Format ──
  const validFormats = ['physical', 'virtual', 'hybrid'];
  if (!body.format || !validFormats.includes(body.format))
    errors.push(`Format must be one of: ${validFormats.join(', ')}.`);

  // ── Online link ──
  const onlineLink = asString(body.venue?.onlineLink);
  if (onlineLink.trim() && !isValidUrl(onlineLink))
    errors.push('Online event link must start with http:// or https://');

  // ── Venue field lengths ──
  const venueTextFields = ['name', 'address', 'city', 'state', 'country'] as const;
  for (const f of venueTextFields) {
    const val = asString(body.venue?.[f]);
    if (val && val.length > LIMITS.venueField.max)
      errors.push(`Venue ${f} cannot exceed ${LIMITS.venueField.max} characters.`);
  }

  // ── Visibility ──
  const validVisibilities = ['public', 'restricted', 'hidden_link', 'hidden_authenticated'];
  if (!body.visibility || !validVisibilities.includes(body.visibility))
    errors.push(`Visibility must be one of: ${validVisibilities.join(', ')}.`);

  // ── Policies ──
  if (body.policies?.attendeeMinAge !== undefined && body.policies.attendeeMinAge !== null) {
    const age = Number(body.policies.attendeeMinAge);
    if (!Number.isInteger(age) || age < LIMITS.attendeeMinAge.min || age > LIMITS.attendeeMinAge.max)
      errors.push(`Minimum attendee age must be a whole number between ${LIMITS.attendeeMinAge.min} and ${LIMITS.attendeeMinAge.max}.`);
  }
  if (body.policies?.cancellationPolicy && body.policies.cancellationPolicy.length > LIMITS.cancellationPolicy.max)
    errors.push(`Cancellation policy cannot exceed ${LIMITS.cancellationPolicy.max} characters.`);

  const validRefundPolicies = ['full', 'partial', 'no_refund'];
  if (body.policies?.refundPolicy && !validRefundPolicies.includes(body.policies.refundPolicy))
    errors.push(`Refund policy must be one of: ${validRefundPolicies.join(', ')}.`);

  // ── FAQs ──
  if (body.faqs) {
    body.faqs.forEach((faq, i) => {
      const q = asString(faq?.question);
      const a = asString(faq?.answer);
      if (!q.trim()) errors.push(`FAQ ${i + 1}: question is required.`);
      else if (q.length > 300) errors.push(`FAQ ${i + 1}: question cannot exceed 300 characters.`);
      if (!a.trim()) errors.push(`FAQ ${i + 1}: answer is required.`);
      else if (a.length > 1000) errors.push(`FAQ ${i + 1}: answer cannot exceed 1000 characters.`);
    });
  }

  if (errors.length > 0)
    throw new Error(errors.join(' | '));
};

// ─── Create — atomic: validate first, then write ──────────────────────────────

export const createEvent = async (body: CreateEventBody) => {
  // Throws before any DB write if validation fails
  validateCreateBody(body);

  const slug = generateSlug(body.title);
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tagIds: mongoose.Types.ObjectId[] = [];
    for (const rawName of body.tags ?? []) {
      const name = String(rawName || '').trim();
      if (!name) continue;
      const slugValue = generateSlug(name);
      const tag = await Tag.findOneAndUpdate(
        { slug: slugValue },
        { $setOnInsert: { name, slug: slugValue, category: 'topic', usageCount: 0 }, $inc: { usageCount: 1 } },
        { upsert: true, new: true, session }
      );
      if (tag?._id) tagIds.push(tag._id);
    }
    const validatedSessions = (body.sessions ?? []).map((s, idx) => {
      validateSessionBody({
        event: '000000000000000000000000',
        title: s.title,
        description: s.description,
        notes: s.notes,
        sessionType: s.sessionType,
        startTime: s.startTime,
        endTime: s.endTime,
        timezone: s.timezone,
        room: s.room,
        streamUrl: s.streamUrl,
        maxAttendees: s.maxAttendees,
        speakers: s.speakers,
        tags: s.tags,
        order: s.order ?? idx,
        createdBy: body.createdBy,
      });
      return { ...s, order: s.order ?? idx };
    });

    const [event] = await Event.create([{
      ...body,
      slug,
      tags: tagIds,
      sessions: undefined,
      status: body.status ?? 'draft',
      visibility: body.visibility ?? 'public',
      changeLog: [{
        changedBy: body.createdBy,
        changedAt: new Date(),
        field: 'status',
        oldValue: null,
        newValue: body.status ?? 'draft',
        description: 'Event created',
      }],
    }], { session });

    if (validatedSessions.length > 0) {
      await Session.insertMany(validatedSessions.map((s) => ({
        event: event._id,
        createdBy: body.createdBy,
        title: s.title,
        description: s.description,
        notes: s.notes,
        sessionType: s.sessionType ?? 'other',
        startTime: s.startTime,
        endTime: s.endTime,
        timezone: s.timezone ?? body.timezone ?? 'Asia/Kolkata',
        room: s.room,
        streamUrl: s.streamUrl,
        maxAttendees: s.maxAttendees,
        speakers: s.speakers,
        tags: s.tags ?? [],
        order: s.order ?? 0,
      })), { session });
    }

    await session.commitTransaction();
    return event;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getEventById = async (id: string) => {
  const event = await Event.findById(id)
    .populate('tags',         'name slug')
    .populate('organization', 'name slug logo')
    .populate('createdBy',    'name email avatar')
    .lean();
  return attachSessions(event as Record<string, unknown> | null);
};

export const getEventBySlug = async (slug: string) => {
  const event = await Event.findOne({ slug })
    .populate('tags',         'name slug')
    .populate('organization', 'name slug logo')
    .populate('createdBy',    'name email avatar')
    .lean();
  return attachSessions(event as Record<string, unknown> | null);
};

export const listEvents = async (filters: {
  status?: string;
  visibility?: string;
  isFree?: boolean;
  search?: string;
  organization?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  /** Single eventType enum value */
  eventType?: string;
  /** Maps to multiple eventTypes (Music → concert, festival, …) */
  category?: string;
  format?: 'physical' | 'virtual' | 'hybrid';
  /** ISO date string — events with startDate >= this */
  startDateFrom?: string;
  /** ISO date string — events with startDate <= this */
  startDateTo?: string;
  /** User’s age — only events where required min age ≤ this (or unset / 0) */
  suitableForAge?: number;
  tag?: string;
}) => {
  const {
    status, visibility = 'public', isFree, search,
    organization, createdBy, page = 1, limit = 12,
    eventType, category, format,
    startDateFrom, startDateTo, suitableForAge, tag,
  } = filters;

  const safePage  = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const query: Record<string, unknown> = {};
  if (status)       query['status']       = status;
  if (visibility)   query['visibility']   = visibility;
  if (isFree !== undefined) query['isFree'] = isFree;
  if (organization) query['organization'] = organization;
  if (createdBy)    query['createdBy']    = createdBy;
  if (search)       query['$text']        = { $search: search };
  if (format)       query['format']       = format;
  if (tag) {
    const tagDoc = await Tag.findOne({ slug: generateSlug(tag) }).select('_id').lean();
    if (tagDoc?._id) query['tags'] = tagDoc._id;
  }

  if (eventType) {
    query['eventType'] = eventType;
  } else if (category && category !== 'All' && CATEGORY_EVENT_TYPES[category]) {
    query['eventType'] = { $in: CATEGORY_EVENT_TYPES[category] };
  }

  const dateRange: Record<string, Date> = {};
  if (startDateFrom) {
    const d = new Date(startDateFrom);
    if (!isNaN(d.getTime())) dateRange['$gte'] = d;
  }
  if (startDateTo) {
    const d = new Date(startDateTo);
    if (!isNaN(d.getTime())) dateRange['$lte'] = d;
  }
  if (Object.keys(dateRange).length > 0) {
    query['startDate'] = dateRange;
  }

  if (suitableForAge !== undefined && Number.isFinite(suitableForAge)) {
    const age = Math.min(120, Math.max(0, Math.floor(Number(suitableForAge))));
    query['$or'] = [
      { 'policies.attendeeMinAge': { $lte: age } },
      { 'policies.attendeeMinAge': { $exists: false } },
      { 'policies.attendeeMinAge': null },
    ];
  }

  const skip = (safePage - 1) * safeLimit;

  const [events, total] = await Promise.all([
    Event.find(query)
      .populate('tags',         'name slug')
      .populate('organization', 'name slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Event.countDocuments(query),
  ]);

  return {
    events,
    pagination: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
  };
};

/** Increment like counter (public, no auth — client may dedupe with localStorage) */
export const incrementEventLikes = async (id: string) => {
  return Event.findByIdAndUpdate(
    id,
    { $inc: { 'analytics.likes': 1 } },
    { new: true },
  ).select('analytics');
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateEvent = async (id: string, body: UpdateEventBody, changedBy: string) => {
  const event = await Event.findById(id);
  if (!event) return null;

  const errors: string[] = [];

  if (body.title !== undefined) {
    if (!body.title.trim()) errors.push('Event name cannot be empty.');
    else if (body.title.trim().length < LIMITS.title.min) errors.push(`Event name must be at least ${LIMITS.title.min} characters.`);
    else if (body.title.trim().length > LIMITS.title.max) errors.push(`Event name cannot exceed ${LIMITS.title.max} characters.`);
  }

  if (body.description !== undefined && body.description !== null) {
    if (!body.description.trim()) errors.push('Description cannot be empty.');
    else if (body.description.trim().length < LIMITS.description.min) errors.push(`Description must be at least ${LIMITS.description.min} characters.`);
    else if (body.description.length > LIMITS.description.max) errors.push(`Description cannot exceed ${LIMITS.description.max.toLocaleString()} characters.`);
  }

  if (body.maxCapacity !== undefined && body.maxCapacity !== null) {
    const cap = Number(body.maxCapacity);
    if (!Number.isInteger(cap) || cap < LIMITS.maxCapacity.min) errors.push(`Capacity must be a whole number ≥ ${LIMITS.maxCapacity.min}.`);
    else if (cap > LIMITS.maxCapacity.max) errors.push(`Capacity cannot exceed ${LIMITS.maxCapacity.max.toLocaleString()}.`);
  }

  if (body.startDate && body.endDate) {
    const s = parseDate(body.startDate);
    const e = parseDate(body.endDate);
    if (!s) errors.push('Start date is not a valid date.');
    if (!e) errors.push('End date is not a valid date.');
    if (s && e && e <= s) errors.push('End date must be after start date.');
  }

  if (errors.length > 0) throw new Error(errors.join(' | '));

  const logEntries: Array<{ changedBy: string; changedAt: Date; field: string; oldValue: unknown; newValue: unknown; description: string }> = [];
  const trackFields = ['title', 'status', 'visibility', 'startDate', 'endDate', 'description'] as const;

  for (const field of trackFields) {
    if (body[field] !== undefined && String(event[field]) !== String(body[field])) {
      logEntries.push({ changedBy, changedAt: new Date(), field, oldValue: event[field], newValue: body[field], description: `${field} updated` });
    }
  }

  return Event.findByIdAndUpdate(
    id,
    { ...body, $push: { changeLog: { $each: logEntries } } },
    { new: true, runValidators: true }
  )
    .populate('tags',         'name slug')
    .populate('organization', 'name slug logo');
};

// ─── Status / Lifecycle ───────────────────────────────────────────────────────

export const changeEventStatus = async (id: string, newStatus: string, changedBy: string) => {
  const event = await Event.findById(id);
  if (!event) return null;

  return Event.findByIdAndUpdate(
    id,
    {
      status: newStatus,
      $push: { changeLog: { changedBy, changedAt: new Date(), field: 'status', oldValue: event.status, newValue: newStatus, description: `Status changed from ${event.status} to ${newStatus}` } },
    },
    { new: true }
  );
};

// ─── Delete (with cascade to sessions) ───────────────────────────────────────

export const deleteEvent = async (id: string) => {
  // Remove all sessions belonging to this event first
  await Session.deleteMany({ event: id });
  return Event.findByIdAndDelete(id);
};

// ─── Changelog ────────────────────────────────────────────────────────────────

export const getChangelog = async (id: string) => {
  return Event.findById(id).select('changeLog title');
};
