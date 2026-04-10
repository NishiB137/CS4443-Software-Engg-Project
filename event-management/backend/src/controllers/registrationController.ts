import type { Request, Response } from 'express';
import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import mongoose from 'mongoose';

const DEV_USER_ID = '000000000000000000000001';

const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

// ─── GET /api/user/registrations ─────────────────────────────────────────────
export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const email = (req.query['email'] as string | undefined)?.trim().toLowerCase();
    if (!email) { res.json({ success: true, data: [] }); return; }
    
    const regs = await Registration.find({ attendeeEmail: email, status: { $ne: 'cancelled' } })
      .populate('eventId')
      .sort({ registrationDate: -1 })
      .lean();
    res.json({ success: true, data: regs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/register ───────────────────────────────────────────
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'id');
    const { attendeeName, attendeeEmail, attendeePhone, ticketTier, formResponses } = req.body as {
      attendeeName: string;
      attendeeEmail: string;
      attendeePhone?: string;
      ticketTier?: string;
      formResponses?: Record<string, unknown>;
    };

    // Validate fields
    if (!attendeeName?.trim())  { res.status(400).json({ success: false, message: 'Name is required.' }); return; }
    if (!attendeeEmail?.trim()) { res.status(400).json({ success: false, message: 'Email is required.' }); return; }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(attendeeEmail)) { res.status(400).json({ success: false, message: 'Invalid email address.' }); return; }

    // Fetch event
    if (!mongoose.Types.ObjectId.isValid(eventId)) { res.status(404).json({ success: false, message: 'Event not found.' }); return; }
    const event = await Event.findById(eventId).lean();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found.' }); return; }

    // Registration window check
    const now = new Date();
    if (event.registrationOpenDate && now < event.registrationOpenDate) {
      res.status(400).json({ success: false, message: 'Registration has not opened yet.' }); return;
    }
    if (event.registrationCloseDate && now > event.registrationCloseDate) {
      res.status(400).json({ success: false, message: 'Registration has closed.' }); return;
    }

    // Capacity check
    if (event.maxCapacity) {
      const count = await Registration.countDocuments({ eventId, status: { $ne: 'cancelled' } });
      if (count >= event.maxCapacity) {
        res.status(400).json({ success: false, message: 'This event is at full capacity.' }); return;
      }
    }

    // Create registration
    const reg = new Registration({
      eventId,
      userId:        req.body.userId || DEV_USER_ID,
      attendeeName:  attendeeName.trim(),
      attendeeEmail: attendeeEmail.trim().toLowerCase(),
      attendeePhone: attendeePhone?.trim(),
      ticketTier:    ticketTier || 'General',
      amountPaid:    0,
      paymentStatus: 'Pending',
      status:        'confirmed',
      formResponses: formResponses || {},
    });

    await reg.save();

    // Increment registration count on event
    await Event.findByIdAndUpdate(eventId, {
      $inc: { registrationCount: 1, 'analytics.registrations': 1 },
    });

    res.status(201).json({ success: true, data: reg });
  } catch (err) {
    // Mongoose duplicate key error (attendeeEmail unique per event)
    const asAny = err as Record<string, unknown>;
    if (typeof asAny['code'] === 'number' && asAny['code'] === 11000) {
      res.status(409).json({ success: false, message: 'You are already registered for this event.' });
      return;
    }
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/events/:id/registrations ───────────────────────────────────────
export const listRegistrations = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'id');
    const regs = await Registration.find({ eventId }).sort({ registrationDate: -1 }).lean();
    const count = regs.filter(r => r.status !== 'cancelled').length;
    const event = await Event.findById(eventId).select('maxCapacity registrationCount').lean();
    res.json({ success: true, data: regs, count, capacity: event?.maxCapacity ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/events/:id/registrations/check?email= ──────────────────────────
export const checkRegistration = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'id');
    const email = (req.query['email'] as string | undefined)?.trim().toLowerCase();
    if (!email) { res.json({ success: true, registered: false }); return; }
    const reg = await Registration.findOne({ eventId, attendeeEmail: email, status: { $ne: 'cancelled' } }).lean();
    res.json({ success: true, registered: !!reg, data: reg ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── DELETE /api/events/:id/registrations/:regId ─────────────────────────────
export const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const { regId } = req.params;
    const reg = await Registration.findByIdAndUpdate(regId, { status: 'cancelled' }, { new: true });
    if (!reg) { res.status(404).json({ success: false, message: 'Registration not found.' }); return; }
    await Event.findByIdAndUpdate(reg.eventId, { $inc: { registrationCount: -1, 'analytics.registrations': -1 } });
    res.json({ success: true, data: reg });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};
