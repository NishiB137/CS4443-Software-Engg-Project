import type { Request, Response } from 'express';
import { UserEventInteraction } from '../models/UserEventInteraction.js';
import { Event } from '../models/Event.js';
import mongoose from 'mongoose';

const DEV_USER_ID = '000000000000000000000001';

// ─── POST /api/bookmarks/:eventId — toggle bookmark ──────────────────────────
export const toggleBookmark = async (req: Request, res: Response) => {
  try {
    const rawId  = req.params['eventId'];
    const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId  = ((req.body as Record<string, unknown>).userId as string | undefined) || DEV_USER_ID;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(404).json({ success: false, message: 'Event not found.' }); return;
    }

    const existing = await UserEventInteraction.findOne({ user: userId, event: new mongoose.Types.ObjectId(eventId) }).lean();

    if (existing) {
      const nextBookmarked = !existing.bookmarked;
      await UserEventInteraction.findByIdAndUpdate(existing._id, { bookmarked: nextBookmarked });
      await Event.findByIdAndUpdate(eventId, {
        $inc: { 'analytics.bookmarks': nextBookmarked ? 1 : -1 },
      });
      res.json({ success: true, bookmarked: nextBookmarked });
    } else {
      await UserEventInteraction.create({ user: userId, event: new mongoose.Types.ObjectId(eventId), bookmarked: true });
      await Event.findByIdAndUpdate(eventId, { $inc: { 'analytics.bookmarks': 1 } });
      res.json({ success: true, bookmarked: true });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/bookmarks — list bookmarked events for current user ─────────────
export const listBookmarks = async (req: Request, res: Response) => {
  try {
    const userId = (req.query['userId'] as string | undefined) || DEV_USER_ID;
    const query: Record<string, unknown> = { bookmarked: true };
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query['user'] = userId;
    } else {
      // If invalid ID passed, return empty list
      res.json({ success: true, data: [], count: 0 });
      return;
    }

    const interactions = await UserEventInteraction
      .find(query)
      .populate({ path: 'event', model: 'Event' })
      .lean();

    const events = interactions.map(i => i.event).filter(Boolean);
    res.json({ success: true, data: events, count: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/bookmarks/check/:eventId ──────────────────────────────────────
export const checkBookmark = async (req: Request, res: Response) => {
  try {
    const rawId  = req.params['eventId'];
    const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId  = (req.query['userId'] as string | undefined) || DEV_USER_ID;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(userId)) {
      res.json({ success: true, bookmarked: false }); return;
    }

    const record = await UserEventInteraction
      .findOne({ user: userId, event: new mongoose.Types.ObjectId(eventId) })
      .lean();
    res.json({ success: true, bookmarked: record?.bookmarked ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};
