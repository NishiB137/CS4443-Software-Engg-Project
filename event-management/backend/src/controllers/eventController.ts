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

    const validStatuses = ['draft', 'published', 'ongoing', 'completed', 'archived'];
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