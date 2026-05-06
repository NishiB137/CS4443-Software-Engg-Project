import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import mongoose from 'mongoose';
import { Tag } from '../models/Tag.js';
import { validateSessionBody } from './sessionService.js';
import { User } from '../models/User.js';
import { UserEventInteraction } from '../models/UserEventInteraction.js';
import { Registration } from '../models/Registration.js';

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
  const isDraft = body.status === 'draft';

  // ── Title ──
  const title = asString(body.title);
  if (!title.trim())
    errors.push('Event name is required.');
  else if (title.trim().length < LIMITS.title.min && !isDraft)
    errors.push(`Event name must be at least ${LIMITS.title.min} characters.`);
  else if (title.trim().length > LIMITS.title.max)
    errors.push(`Event name cannot exceed ${LIMITS.title.max} characters.`);

  // ── Short description ──
  const shortDescription = asString(body.shortDescription);
  if (shortDescription && shortDescription.length > LIMITS.shortDescription.max)
    errors.push(`Short description cannot exceed ${LIMITS.shortDescription.max} characters.`);

  // ── Full description ──
  const description = asString(body.description);
  if (!isDraft) {
    if (!description.trim())
      errors.push('Event description is required.');
    else if (description.trim().length < LIMITS.description.min)
      errors.push(`Description must be at least ${LIMITS.description.min} characters.`);
    else if (description.length > LIMITS.description.max)
      errors.push(`Description cannot exceed ${LIMITS.description.max.toLocaleString()} characters.`);
  } else if (description.trim() && description.length > LIMITS.description.max) {
    errors.push(`Description cannot exceed ${LIMITS.description.max.toLocaleString()} characters.`);
  }

  // ── Dates — must be present, parseable, non-epoch, and ordered ──
  const start = parseDate(body.startDate);
  const end   = parseDate(body.endDate);

  if (!isDraft) {
    if (!asString(body.startDate).trim()) errors.push('Start date is required.');
    else if (!start)             errors.push('Start date is not a valid date.');

    if (!asString(body.endDate).trim())   errors.push('End date is required.');
    else if (!end)               errors.push('End date is not a valid date.');
  }

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

  // ── Event Type ──
  const eventTypeVal = asString(body.eventType).trim();
  if (!eventTypeVal)
    errors.push('Event type is required and cannot be empty.');


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

  // ── Paid events must require registration ──
  if (body.isFree === false || body.isFree === 'false' as any || (typeof body.isFree === 'boolean' && !body.isFree)) {
    if (!body.requiresRegistration) {
      errors.push('Paid events must have registration enabled.');
    }
    // Ensure attendeeName and attendeeEmail are in registrationFields
    const regFields = (body.registrationFields ?? []) as Array<{ key: string }>;
    const hasName  = regFields.some(f => f.key === 'attendeeName');
    const hasEmail = regFields.some(f => f.key === 'attendeeEmail');
    if (!hasName || !hasEmail) {
      errors.push('Paid events must collect at least the attendee name and email.');
    }
  }

  // ── Ticketing Tiers Validation ──
  if (body.ticketingTiers && body.ticketingTiers.length > 0) {
    body.ticketingTiers.forEach((tier, i) => {
      if (!tier.name || !String(tier.name).trim()) errors.push(`Ticket tier ${i + 1}: name is required.`);
      if (typeof tier.price !== 'number' || tier.price < 0) errors.push(`Ticket tier ${i + 1}: price must be 0 or greater.`);
      if (tier.capacity !== undefined && tier.capacity !== null) {
        if (typeof tier.capacity !== 'number' || tier.capacity <= 0) errors.push(`Ticket tier ${i + 1}: capacity must be greater than 0.`);
      }
    });
  }

  if (errors.length > 0)
    throw new Error(errors.join(' | '));
};


// ─── Create — atomic: validate first, then write ──────────────────────────────

export const createEvent = async (body: CreateEventBody) => {
  // Throws before any DB write if validation fails
  validateCreateBody(body);

  const isDraft = body.status === 'draft';
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
        description: s.description ?? '',
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
      } as any, isDraft);
      return { ...s, order: s.order ?? idx };
    });

    const { sessions: _ignoreSessions, ...payloadBody } = body;

    const [event] = await Event.create([{
      ...payloadBody,
      slug,
      tags: tagIds,
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

    if (validatedSessions.length > 0 && event) {
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

const calculateDynamicStatus = (event: any) => {
  if (event.status === 'published' && event.startDate && event.endDate) {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'ongoing';
  }
  return event.status;
};

export const getEventById = async (id: string) => {
  const event = await Event.findById(id)
    .populate('tags',         'name slug')
    .populate('organization', 'name slug logo')
    .populate('createdBy',    'name email avatar')
    .populate('team.user',    'name username email')
    .populate('reviewer',     'name username email')
    .lean();
  if (event) event.status = calculateDynamicStatus(event);
  return attachSessions(event as Record<string, unknown> | null);
};

export const getEventBySlug = async (slug: string) => {
  const event = await Event.findOne({ slug })
    .populate('tags',         'name slug')
    .populate('organization', 'name slug logo')
    .populate('createdBy',    'name email avatar')
    .populate('team.user',    'name username email')
    .populate('reviewer',     'name username email')
    .lean();
  if (event) event.status = calculateDynamicStatus(event);
  return attachSessions(event as Record<string, unknown> | null);
};

export const listEvents = async (filters: {
  status?: string;
  visibility?: string;
  isFree?: boolean;
  search?: string;
  organization?: string;
  createdBy?: string;
  userRolesFor?: string;
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
    organization, createdBy, userRolesFor, page = 1, limit = 12,
    eventType, category, format,
    startDateFrom, startDateTo, suitableForAge, tag,
  } = filters;

  const safePage  = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const query: Record<string, unknown> = {};
  const andClauses: any[] = [];

  if (status)       query['status']       = status;
  if (visibility && visibility !== 'all') query['visibility'] = visibility;
  if (isFree !== undefined) query['isFree'] = isFree;
  if (organization && mongoose.Types.ObjectId.isValid(organization)) {
    query['organization'] = organization;
  }
  if (createdBy) {
    if (mongoose.Types.ObjectId.isValid(createdBy)) {
      query['createdBy'] = createdBy;
    } else {
      query['createdBy'] = new mongoose.Types.ObjectId();
    }
  }
  if (userRolesFor) {
    if (mongoose.Types.ObjectId.isValid(userRolesFor)) {
      andClauses.push({
        $or: [
          { createdBy: userRolesFor },
          { 'team.user': userRolesFor }
        ]
      });
    } else {
      andClauses.push({ createdBy: new mongoose.Types.ObjectId() });
    }
  }
  if (search) {
    const regex = new RegExp(search, 'i');

    // Resolve tag IDs whose names match the search term
    const matchedTags = await Tag.find({ name: regex }).select('_id').lean();
    const tagIds = matchedTags.map(t => t._id);

    // Map category keywords → event types (e.g. "tech" → conference, hackathon, webinar)
    const categoryMatches: string[] = [];
    for (const [catName, types] of Object.entries(CATEGORY_EVENT_TYPES)) {
      if (regex.test(catName)) {
        categoryMatches.push(...types);
      }
    }

    const orClauses: any[] = [
      { title: regex },
      { shortDescription: regex },
      { description: regex },
      { organizerName: regex },
      { eventType: regex },
      { 'venue.city': regex },
      { 'venue.country': regex },
      { 'venue.name': regex },
      { format: regex },
      ...(tagIds.length > 0 ? [{ tags: { $in: tagIds } }] : []),
      ...(categoryMatches.length > 0 ? [{ eventType: { $in: categoryMatches } }] : []),
    ];

    andClauses.push({ $or: orClauses });
  }
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
    andClauses.push({
      $or: [
        { 'policies.attendeeMinAge': { $lte: age } },
        { 'policies.attendeeMinAge': { $exists: false } },
        { 'policies.attendeeMinAge': null },
      ]
    });
  }

  if (andClauses.length > 0) {
    query['$and'] = andClauses;
  }

  const skip = (safePage - 1) * safeLimit;

  const [events, total] = await Promise.all([
    Event.find(query)
      .select(
        'title slug shortDescription coverImage startDate endDate format isFree currency status ' +
        'visibility eventType organizerName analytics maxCapacity registrationCount ' +
        'venue.city venue.name venue.onlineLink tags createdBy organization templateId requiresRegistration pricing ticketingTiers'
      )
      .populate('tags',         'name slug')
      .populate('organization', 'name slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Event.countDocuments(query),
  ]);


  const updatedEvents = events.map(e => ({ ...e, status: calculateDynamicStatus(e) }));

  return {
    events: updatedEvents,
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

/** Decrement like counter */
export const decrementEventLikes = async (id: string) => {
  return Event.findByIdAndUpdate(
    id,
    { $inc: { 'analytics.likes': -1 } },
    { new: true },
  ).select('analytics');
};

/** Increment view counter */
export const incrementEventViews = async (id: string) => {
  return Event.findByIdAndUpdate(
    id,
    { $inc: { 'analytics.views': 1 } },
    { new: true },
  ).select('analytics');
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateEvent = async (id: string, body: UpdateEventBody, changedBy: string) => {
  const event = await Event.findById(id);
  if (!event) return null;

  const errors: string[] = [];

  const isDraft = (body.status || event.status) === 'draft';

  if (body.title !== undefined) {
    if (!body.title.trim()) errors.push('Event name cannot be empty.');
    else if (body.title.trim().length < LIMITS.title.min && !isDraft) errors.push(`Event name must be at least ${LIMITS.title.min} characters.`);
    else if (body.title.trim().length > LIMITS.title.max) errors.push(`Event name cannot exceed ${LIMITS.title.max} characters.`);
  }

  if (body.description !== undefined && body.description !== null) {
    if (!isDraft) {
      if (!body.description.trim()) errors.push('Description cannot be empty.');
      else if (body.description.trim().length < LIMITS.description.min) errors.push(`Description must be at least ${LIMITS.description.min} characters.`);
    }
    if (body.description.length > LIMITS.description.max) errors.push(`Description cannot exceed ${LIMITS.description.max.toLocaleString()} characters.`);
  }

  if (body.maxCapacity !== undefined && body.maxCapacity !== null) {
    const cap = Number(body.maxCapacity);
    if (!Number.isInteger(cap) || cap < LIMITS.maxCapacity.min) errors.push(`Capacity must be a whole number ≥ ${LIMITS.maxCapacity.min}.`);
    else if (cap > LIMITS.maxCapacity.max) errors.push(`Capacity cannot exceed ${LIMITS.maxCapacity.max.toLocaleString()}.`);
  }

  // ── Event Type ──
  if (body.eventType !== undefined) {
    const etVal = String(body.eventType ?? '').trim();
    if (!etVal) errors.push('Event type cannot be empty.');
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

  const { sessions: _ignoreSessions, ...updateBody } = body;

  if (body.sessions) {
    const validatedSessions = body.sessions.map((s, idx) => {
      validateSessionBody({
        event: id,
        title: s.title,
        description: s.description ?? '',
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
        createdBy: changedBy,
      } as any, isDraft);
      return { ...s, order: s.order ?? idx };
    });

    await Session.deleteMany({ event: id });
    if (validatedSessions.length > 0) {
      await Session.insertMany(validatedSessions.map((s) => ({
        event: id,
        createdBy: changedBy,
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
      })));
    }
  }

  return Event.findByIdAndUpdate(
    id,
    { ...updateBody, $push: { changeLog: { $each: logEntries } } },
    { new: true, runValidators: true }
  )
    .populate('tags',         'name slug')
    .populate('organization', 'name slug logo');
};

// ─── Status / Lifecycle ───────────────────────────────────────────────────────

export const changeEventStatus = async (id: string, newStatus: string, changedBy: string) => {
  const event = await Event.findById(id);
  if (!event) return null;

  if (newStatus === 'published') {
    // Validate strictly for publishing: convert Date fields to ISO strings for the validator
    const objToValidate = event.toObject() as any;

    // Ensure startDate / endDate are ISO strings, not Date objects
    if (objToValidate.startDate instanceof Date) {
      objToValidate.startDate = objToValidate.startDate.toISOString();
    }
    if (objToValidate.endDate instanceof Date) {
      objToValidate.endDate = objToValidate.endDate.toISOString();
    }

    const bodyToValidate = {
      ...objToValidate,
      status: 'published',
    };

    try {
      validateCreateBody(bodyToValidate as any);
    } catch (e: any) {
      throw new Error(`Cannot publish: ${e.message}`);
    }
  }

  const updated = await Event.findByIdAndUpdate(
    id,
    {
      status: newStatus,
      $push: { changeLog: { changedBy, changedAt: new Date(), field: 'status', oldValue: event.status, newValue: newStatus, description: `Status changed from ${event.status} to ${newStatus}` } },
    },
    { new: true }
  ).lean();
  
  if (updated) updated.status = calculateDynamicStatus(updated);
  return updated;
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

// ─── Approve / Reject ─────────────────────────────────────────────────────────

export const approveEvent = async (id: string, changedBy: string) => {
  return changeEventStatus(id, 'published', changedBy);
};

export const rejectEvent = async (id: string, changedBy: string, reason?: string) => {
  const event = await Event.findById(id);
  if (!event) return null;
  return Event.findByIdAndUpdate(
    id,
    {
      status: 'draft',
      $push: {
        changeLog: {
          changedBy,
          changedAt: new Date(),
          field: 'status',
          oldValue: event.status,
          newValue: 'draft',
          description: reason ? `Rejected: ${reason}` : 'Rejected by admin — returned to draft',
        },
      },
    },
    { new: true }
  ).lean();
};

export const listPendingReview = async (reviewerId?: string) => {
  const query: Record<string, unknown> = { status: 'review' };
  if (reviewerId && mongoose.Types.ObjectId.isValid(reviewerId)) {
    query['reviewer'] = reviewerId;
  }
  return Event.find(query)
    .select('title slug status createdAt startDate endDate eventType format organizerName coverImage createdBy reviewer requiresReview team')
    .populate('createdBy', 'name email username')
    .populate('reviewer', 'name email username')
    .sort({ createdAt: -1 })
    .lean();
};

// ─── Recommendations ──────────────────────────────────────────────────────────

export const getRecommendedEvents = async (userId?: string) => {
  const now = new Date();
  const baseQuery = {
    status: 'published',
    visibility: 'public',
    startDate: { $gte: now },
  };

  // 1. Fetch upcoming events with popularity stats
  const upcomingEvents = await Event.find(baseQuery)
    .select('title slug shortDescription coverImage startDate endDate format isFree currency status visibility eventType organizerName analytics maxCapacity registrationCount venue.city venue.name venue.onlineLink tags createdBy organization templateId requiresRegistration pricing ticketingTiers')
    .populate('tags', 'name slug')
    .populate('organization', 'name slug logo')
    .lean();

  // Helper to calculate Global Popularity Score
  const getPopularityScore = (event: any) => {
    const a = event.analytics || { views: 0, likes: 0, bookmarks: 0, registrations: 0 };
    return (a.views || 0) + ((a.likes || 0) * 3) + ((a.bookmarks || 0) * 4) + ((a.registrations || 0) * 10);
  };

  // 2. Score and limit Trending
  const trending = [...upcomingEvents]
    .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
    .slice(0, 6);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { forYou: [], trending, viewedEventTypes: [] };
  }

  // 3. Build Affinity Profile for logged-in user
  const user = await User.findById(userId).select('interests').lean();
  const interests: string[] = (user?.interests ?? []) as string[];
  
  const interactions = await UserEventInteraction.find({ user: userId }).lean();
  const registrations = await Registration.find({ userId }).select('eventId').lean();

  const interactedEventIds = new Set([
    ...interactions.map(i => i.event.toString()),
    ...registrations.map(r => r.eventId.toString())
  ]);

  const interactedEvents = interactedEventIds.size > 0
    ? await Event.find({ _id: { $in: Array.from(interactedEventIds) } }).select('tags eventType').populate('tags', 'slug').lean()
    : [];

  const eventMap = new Map(interactedEvents.map(e => [e._id.toString(), e]));

  const affinityScore: Record<string, number> = {};

  const addAffinity = (key: string, weight: number) => {
    if (!key) return;
    affinityScore[key] = (affinityScore[key] || 0) + weight;
  };

  // Explicit Interests (+5)
  for (const slug of interests) {
    addAffinity(`tag:${slug}`, 5);
  }

  // Interactions
  for (const i of interactions) {
    const e = eventMap.get(i.event.toString());
    if (!e) continue;
    
    let weight = 0;
    if (i.viewedAt) weight += 1;
    if (i.liked) weight += 3;
    if (i.bookmarked) weight += 5;
    
    if (weight > 0) {
      addAffinity(`type:${e.eventType}`, weight);
      for (const t of (e.tags as any) || []) addAffinity(`tag:${t.slug}`, weight);
    }
  }

  // Registrations (+10)
  for (const r of registrations) {
    const e = eventMap.get(r.eventId.toString());
    if (!e) continue;
    addAffinity(`type:${e.eventType}`, 10);
    for (const t of (e.tags as any) || []) addAffinity(`tag:${t.slug}`, 10);
  }

  // 4. Score 'For You' Candidates
  // Exclude already interacted events
  const candidates = upcomingEvents.filter(e => !interactedEventIds.has(e._id.toString()));

  const scoredCandidates = candidates.map(e => {
    let score = 0;
    // Affinity matching
    if (e.eventType) score += (affinityScore[`type:${e.eventType}`] || 0);
    for (const t of (e.tags as any) || []) {
      score += (affinityScore[`tag:${t.slug}`] || 0);
    }
    
    // Add a scaled popularity boost to break ties and surface good events
    score += getPopularityScore(e) * 0.1;
    
    return { event: e, score };
  });

  const forYou = scoredCandidates
    .filter(c => c.score > 0) // Only return events that have SOME affinity or popularity
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(c => c.event);

  // Exclude 'For You' from 'Trending' so we don't show duplicates
  const forYouIds = new Set(forYou.map(e => e._id.toString()));
  const filteredTrending = trending.filter(e => !forYouIds.has(e._id.toString())).slice(0, 6);

  // Gather unique event types for the frontend chips fallback
  const viewedEventTypes = Array.from(new Set(
    interactedEvents.map(e => e.eventType).filter(Boolean)
  ));

  return { forYou, trending: filteredTrending, viewedEventTypes };
};
