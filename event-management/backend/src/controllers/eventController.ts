import type { Request, Response } from 'express';
import * as eventService from '../services/eventService.js';

// Temporary dev user IDs until auth is implemented (Sprint 3)
const DEV_USER_ID  = '000000000000000000000001';
const DEV_ORG_ID   = '000000000000000000000002';

// Helper: Express params can be string | string[] — always get a plain string
const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

// ─── POST /api/events ─────────────────────────────────────────────────────────
export const createEvent = async (req: Request, res: Response) => {
  try {
    const body = {
      ...req.body,
      // Sprint 2: use dev IDs if not provided (auth skipped)
      createdBy:    req.body.createdBy    || DEV_USER_ID,
      organization: req.body.organization || DEV_ORG_ID,
    };

    const event = await eventService.createEvent(body);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, message });
  }
};


// ─── GET /api/events ──────────────────────────────────────────────────────────
export const listEvents = async (req: Request, res: Response) => {
  try {
    const {
      status,
      visibility,
      isFree,
      search,
      organization,
      createdBy,
      page,
      limit,
      category,
      eventType,
      format,
      startDateFrom,
      startDateTo,
      suitableForAge,
      tag,
    } = req.query;

    // exactOptionalPropertyTypes: only include keys whose value is not undefined
    const filters: Parameters<typeof eventService.listEvents>[0] = {
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 12,
    };
    if (typeof status       === 'string') filters.status       = status;
    if (typeof visibility   === 'string') filters.visibility   = visibility;
    if (typeof search       === 'string') filters.search       = search;
    if (typeof organization === 'string') filters.organization = organization;
    if (typeof createdBy    === 'string') filters.createdBy    = createdBy;
    if (isFree === 'true')  filters.isFree = true;
    if (isFree === 'false') filters.isFree = false;
    if (typeof category === 'string') filters.category = category;
    if (typeof eventType === 'string') filters.eventType = eventType;
    if (format === 'physical' || format === 'virtual' || format === 'hybrid') filters.format = format;
    if (typeof startDateFrom === 'string') filters.startDateFrom = startDateFrom;
    if (typeof startDateTo === 'string') filters.startDateTo = startDateTo;
    if (typeof suitableForAge === 'string' && suitableForAge.trim() !== '') {
      const n = Number(suitableForAge);
      if (!Number.isNaN(n)) filters.suitableForAge = n;
    }
    if (typeof tag === 'string') filters.tag = tag;

    const result = await eventService.listEvents(filters);
    res.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/events/:id ──────────────────────────────────────────────────────
export const getEvent = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getEventById(param(req, 'id'));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/events/slug/:slug ───────────────────────────────────────────────
export const getEventBySlug = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getEventBySlug(param(req, 'slug'));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────
export const updateEvent = async (req: Request, res: Response) => {
  try {
    console.log('[DEBUG-UPDATE] req.body:', JSON.stringify(req.body, null, 2));
    const changedBy = req.body.changedBy || DEV_USER_ID;
    const event = await eventService.updateEvent(param(req, 'id'), req.body, changedBy);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, message });
  }
};

// ─── PATCH /api/events/:id/status ────────────────────────────────────────────
export const changeStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: string };
    const changedBy = req.body.changedBy || DEV_USER_ID;

    const validStatuses = ['draft', 'review', 'approved', 'published', 'ongoing', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      return;
    }

    const event = await eventService.changeEventStatus(param(req, 'id'), status, changedBy);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── PATCH /api/events/:id/publish ───────────────────────────────────────────
export const publishEvent = async (req: Request, res: Response) => {
  req.body.status = 'published';
  return changeStatus(req, res);
};

// ─── PATCH /api/events/:id/archive ───────────────────────────────────────────
export const archiveEvent = async (req: Request, res: Response) => {
  req.body.status = 'archived';
  return changeStatus(req, res);
};

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await eventService.deleteEvent(param(req, 'id'));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/like — increment public like counter ───────────────
export const likeEvent = async (req: Request, res: Response) => {
  try {
    const updated = await eventService.incrementEventLikes(param(req, 'id'));
    if (!updated) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({
      success: true,
      likes: updated.analytics?.likes ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/unlike — decrement public like counter ─────────────
export const unlikeEvent = async (req: Request, res: Response) => {
  try {
    const updated = await eventService.decrementEventLikes(param(req, 'id'));
    if (!updated) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    // Prevent likes from falling below 0
    if (updated.analytics && updated.analytics.likes < 0) {
      await eventService.incrementEventLikes(param(req, 'id'));
      res.json({ success: true, likes: 0 });
      return;
    }
    
    res.json({
      success: true,
      likes: updated.analytics?.likes ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/view — increment public view counter ───────────────
export const incrementView = async (req: Request, res: Response) => {
  try {
    const updated = await eventService.incrementEventViews(param(req, 'id'));
    if (!updated) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({
      success: true,
      views: updated.analytics?.views ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/events/:id/changelog ───────────────────────────────────────────
export const getChangelog = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getChangelog(param(req, 'id'));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event.changeLog });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/events/hierarchy/tree ───────────────────────────────────────────
import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { EventTemplate, type IFieldSpec, type ISessionTemplate } from '../models/EventTemplate.js';

export const getHierarchy = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all main events
    const mainEvents = await Event.find({ eventLevel: 'main' }).lean();
    
    // 2. Map through to attach Sub-events and Sessions
    const hierarchy = await Promise.all(mainEvents.map(async (main) => {
      const subEvents = await Event.find({ parentEvent: main._id }).lean();
      const mainSessions = await Session.find({ event: main._id }).lean();
      
      const populatedSubEvents = await Promise.all(subEvents.map(async (sub) => {
        const subSessions = await Session.find({ event: sub._id }).lean();
        return { ...sub, sessions: subSessions };
      }));

      return {
        ...main,
        subEvents: populatedSubEvents,
        sessions: mainSessions
      };
    }));

    res.json({ success: true, data: hierarchy });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/save-as-template ────────────────────────────────────
export const saveAsTemplate = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'id');
    const event = await Event.findById(eventId).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const templateName = (req.body as { name?: string }).name
      || `${event.title} (Template)`;

    // Find the linked template (if any) to copy its fields as the base
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let baseFields: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let baseLayout: any = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let baseSessionTemplates: any[] = [];
    if (event.templateId) {
      const linked = await EventTemplate.findById(event.templateId).lean();
      if (linked) {
        const getSystemVal = (key: string): string | undefined => {
          const sysMap: Record<string, any> = {
            title: event.title,
            shortDescription: event.shortDescription,
            description: event.description,
            coverImage: event.coverImage,
            videoUrl: event.media?.videoUrl,
            eventType: event.eventType,
            format: event.format,
            isFree: event.isFree !== undefined ? String(event.isFree) : undefined,
            startDate: event.startDate ? new Date(event.startDate as any).toISOString().split('T')[0] : undefined,
            startTime: event.startDate ? new Date(event.startDate as any).toISOString().split('T')[1]?.substring(0, 5) : undefined,
            endDate: event.endDate ? new Date(event.endDate as any).toISOString().split('T')[0] : undefined,
            endTime: event.endDate ? new Date(event.endDate as any).toISOString().split('T')[1]?.substring(0, 5) : undefined,
            timezone: event.timezone,
            maxCapacity: event.maxCapacity !== undefined ? String(event.maxCapacity) : undefined,
            venue_name: event.venue?.name,
            venue_address: event.venue?.address,
            venue_city: event.venue?.city,
            venue_state: event.venue?.state,
            venue_country: event.venue?.country,
            onlineLink: event.venue?.onlineLink,
            organizerName: event.organizerName,
          };
          const val = sysMap[key];
          return val !== undefined && val !== null ? String(val) : undefined;
        };

        baseFields = linked.fields.map((f) => {
          const sysVal = getSystemVal(f.key);
          let customVal: string | undefined = undefined;
          if (f.section === 'custom' || f.section === 'policies') {
            const cf = (event.customFields ?? []).find((c) => c.key === f.key);
            if (cf && cf.value !== undefined && cf.value !== null) {
              customVal = String(cf.value);
            }
          }
          const finalVal = sysVal !== undefined ? sysVal : customVal;
          return {
            ...f,
            defaultValue: finalVal !== undefined ? finalVal : (f.defaultValue ?? ''),
          };
        });

        baseLayout = linked.layout;
        baseSessionTemplates = linked.sessionTemplates;
      }
    }

    const tpl = await EventTemplate.create({
      name:             templateName,
      description:      event.shortDescription || event.description?.slice(0, 200) || '',
      eventType:        event.eventType,
      format:           event.format,
      isFree:           event.isFree,
      isDefault:        false,
      isSystemTemplate: false,
      createdBy:        event.createdBy,
      organization:     event.organization,
      fields:           baseFields,
      layout:           baseLayout,
      defaultVisibility: event.visibility || 'public',
      defaultStatus:     'draft',
      defaultPolicies:   event.policies ?? {},
      sessionTemplates:  baseSessionTemplates,
      coverColor:        '#3B82F6',
      tags:              [],
    });

    res.status(201).json({ success: true, data: tpl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};