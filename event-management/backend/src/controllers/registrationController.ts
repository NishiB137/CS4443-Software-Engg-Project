import type { Request, Response } from 'express';
import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

const QR_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_qr_code_xyz123';

const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

// ─── Helper: derive a username from email ─────────────────────────────────────
const deriveUsername = async (email: string): Promise<string> => {
  const base = email.split('@')[0]!
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '_')
    .substring(0, 25);
  let candidate = base;
  let attempt   = 0;
  while (await User.exists({ username: candidate })) {
    attempt++;
    candidate = `${base}_${attempt}`;
  }
  return candidate;
};

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
    const { attendeeName, attendeeEmail, attendeePhone, ticketTier, formResponses, userId: bodyUserId } = req.body as {
      attendeeName: string;
      attendeeEmail: string;
      attendeePhone?: string;
      ticketTier?: string;
      formResponses?: Record<string, unknown>;
      userId?: string;
    };

    // ── Validate inputs ──
    if (!attendeeName?.trim())  { res.status(400).json({ success: false, message: 'Name is required.' }); return; }
    if (!attendeeEmail?.trim()) { res.status(400).json({ success: false, message: 'Email is required.' }); return; }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(attendeeEmail.trim())) { res.status(400).json({ success: false, message: 'Invalid email address.' }); return; }

    // ── Fetch event ──
    if (!mongoose.Types.ObjectId.isValid(eventId)) { res.status(404).json({ success: false, message: 'Event not found.' }); return; }
    const event = await Event.findById(eventId).lean();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found.' }); return; }

    // ── Paid events must have registration enabled ──
    if (!event.isFree && !event.requiresRegistration) {
      res.status(400).json({ success: false, message: 'Paid events must have registration enabled.' });
      return;
    }

    // ── Registration window check ──
    const now = new Date();
    if (event.registrationOpenDate && now < event.registrationOpenDate) {
      res.status(400).json({ success: false, message: 'Registration has not opened yet.' }); return;
    }
    if (event.registrationCloseDate && now > event.registrationCloseDate) {
      res.status(400).json({ success: false, message: 'Registration has closed.' }); return;
    }

    // ── Capacity check (Global & Tier-specific) ──
    if (event.maxCapacity) {
      const count = await Registration.countDocuments({ eventId, status: { $ne: 'cancelled' } });
      if (count >= event.maxCapacity) {
        res.status(400).json({ success: false, message: 'This event is at full capacity.' }); return;
      }
    }

    const tierName = ticketTier || 'General';
    let amountPaid = 0;
    if (event.ticketingTiers && event.ticketingTiers.length > 0) {
      const tier = event.ticketingTiers.find(t => t.name === tierName);
      if (!tier) {
        res.status(400).json({ success: false, message: `Ticket tier "${tierName}" does not exist.` }); return;
      }
      if (tier.capacity) {
        const tierCount = await Registration.countDocuments({ eventId, ticketTier: tierName, status: { $ne: 'cancelled' } });
        if (tierCount >= tier.capacity) {
          res.status(400).json({ success: false, message: `The ${tierName} ticket tier is sold out.` }); return;
        }
      }
      amountPaid = tier.price || 0;
    }

    // ── Resolve or auto-create user account ──────────────────────────────────
    const emailClean = attendeeEmail.trim().toLowerCase();
    let resolvedUserId: string;

    if (bodyUserId) {
      resolvedUserId = bodyUserId;
    } else {
      // Look up existing user by email, or create a guest account
      let user = await User.findOne({ email: emailClean }).lean();
      if (!user) {
        const username = await deriveUsername(emailClean);
        const newUser = await User.create({
          username,
          name:     attendeeName.trim(),
          email:    emailClean,
          role:     'attendee',
          isGuest:  true,
          isVerified: false,
        });
        resolvedUserId = String(newUser._id);
      } else {
        resolvedUserId = String(user._id);
      }
    }

    // ── Create registration ──
    const reg = new Registration({
      eventId,
      userId:        resolvedUserId,
      attendeeName:  attendeeName.trim(),
      attendeeEmail: emailClean,
      attendeePhone: attendeePhone?.trim(),
      ticketTier:    tierName,
      amountPaid:    amountPaid,
      paymentStatus: amountPaid > 0 ? 'Completed' : 'Pending',
      status:        'confirmed',
      formResponses: formResponses || {},
    });

    await reg.save();

    // ── Generate HMAC QR token ──
    const signature = crypto.createHmac('sha256', QR_SECRET).update(`${eventId}:${reg._id.toString()}`).digest('hex');
    const qrToken   = `${eventId}:${reg._id.toString()}:${signature}`;
    reg.qrToken     = qrToken;
    await reg.save();

    // ── Increment analytics ──
    await Event.findByIdAndUpdate(eventId, {
      $inc: { registrationCount: 1, 'analytics.registrations': 1 },
    });

    // Return the guest user info so the frontend can auto-login if needed
    const guestUser = !bodyUserId
      ? await User.findById(resolvedUserId).select('_id username email name isGuest').lean()
      : null;

    res.status(201).json({ success: true, data: reg, qrToken, newAccount: guestUser });
  } catch (err) {
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
    const checkedInStatus  = req.query['checkedIn']  as string | undefined;
    const checkedOutStatus = req.query['checkedOut'] as string | undefined;

    const query: any = { eventId };
    if (checkedInStatus  === 'true')  query.checkedIn  = true;
    if (checkedInStatus  === 'false') query.checkedIn  = false;
    if (checkedOutStatus === 'true')  query.checkedOut = true;
    if (checkedOutStatus === 'false') query.checkedOut = false;

    const regs  = await Registration.find(query).sort({ registrationDate: -1 }).lean();
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

// ─── QR token parser / verifier ──────────────────────────────────────────────
const parseAndVerifyQR = (qrToken: string, eventId: string): { regId: string } | { error: string } => {
  if (!qrToken || typeof qrToken !== 'string') return { error: 'Missing or invalid QR token.' };
  const parts = qrToken.split(':');
  if (parts.length !== 3) return { error: 'Invalid ticket token format.' };
  const [tokenEventId, regId, signature] = parts as [string, string, string];
  if (tokenEventId !== eventId) return { error: 'Ticket is not valid for this event.' };
  const expected = crypto.createHmac('sha256', QR_SECRET).update(`${tokenEventId}:${regId}`).digest('hex');
  if (signature !== expected) return { error: 'Tampered or invalid ticket signature.' };
  return { regId };
};

// ─── POST /api/events/:id/validate-qr  (CHECK-IN via QR) ────────────────────
export const validateQR = async (req: Request, res: Response) => {
  try {
    const eventId  = param(req, 'id');
    const { qrToken } = req.body;

    const parsed = parseAndVerifyQR(qrToken, eventId);
    if ('error' in parsed) { res.status(400).json({ success: false, message: parsed.error }); return; }

    const event = await Event.findById(eventId).lean();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found.' }); return; }

    const reg = await Registration.findById(parsed.regId);
    if (!reg || reg.status !== 'confirmed' || reg.eventId.toString() !== eventId) {
      res.status(400).json({ success: false, message: 'Ticket is invalid or not confirmed.' });
      return;
    }

    // ── Single check-in enforcement ──
    if (reg.checkedIn) {
      res.status(409).json({ success: false, message: `Already checked in at ${new Date(reg.checkedInAt[0]).toLocaleTimeString()}. Each ticket can only be scanned once.` });
      return;
    }

    // ── Time-window check ──
    const now = new Date();
    if (event.entrySettings?.requireSpecificTime) {
      const start = event.entrySettings.entryStartTime ? new Date(event.entrySettings.entryStartTime) : null;
      const end   = event.entrySettings.entryEndTime   ? new Date(event.entrySettings.entryEndTime)   : null;
      if (start && now < start) {
        res.status(400).json({ success: false, message: `Check-in opens at ${start.toLocaleTimeString()}. Too early to scan.` }); return;
      }
      if (end && now > end) {
        res.status(400).json({ success: false, message: `Check-in window closed at ${end.toLocaleTimeString()}.` }); return;
      }
    }

    reg.checkedIn = true;
    reg.checkedInAt.push(now);
    reg.checkInCount += 1;
    await reg.save();

    res.json({ success: true, data: reg, message: `✓ Check-in successful: ${reg.attendeeName}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/validate-checkout-qr  (CHECK-OUT via QR) ───────────
export const validateCheckoutQR = async (req: Request, res: Response) => {
  try {
    const eventId  = param(req, 'id');
    const { qrToken } = req.body;

    const parsed = parseAndVerifyQR(qrToken, eventId);
    if ('error' in parsed) { res.status(400).json({ success: false, message: parsed.error }); return; }

    const event = await Event.findById(eventId).lean();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found.' }); return; }

    const reg = await Registration.findById(parsed.regId);
    if (!reg || reg.status !== 'confirmed' || reg.eventId.toString() !== eventId) {
      res.status(400).json({ success: false, message: 'Ticket is invalid or not confirmed.' });
      return;
    }

    if (!reg.checkedIn) {
      res.status(400).json({ success: false, message: 'Attendee has not checked in yet.' }); return;
    }
    if (reg.checkedOut) {
      res.status(409).json({ success: false, message: 'Attendee already checked out.' }); return;
    }

    const now = new Date();
    reg.checkedOut = true;
    reg.checkedOutAt.push(now);
    reg.checkOutCount += 1;
    await reg.save();

    res.json({ success: true, data: reg, message: `✓ Check-out successful: ${reg.attendeeName}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/events/:id/registrations/:regId/checkout  (MANUAL CHECK-OUT) ──
// Check-out is a manual organizer action — no QR scan required.
export const checkoutRegistration = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'id');
    const regId   = req.params['regId'];

    if (!mongoose.Types.ObjectId.isValid(regId)) {
      res.status(400).json({ success: false, message: 'Invalid registration ID.' }); return;
    }

    const reg = await Registration.findById(regId);
    if (!reg || reg.status !== 'confirmed' || reg.eventId.toString() !== eventId) {
      res.status(404).json({ success: false, message: 'Registration not found for this event.' }); return;
    }

    if (!reg.checkedIn) {
      res.status(400).json({ success: false, message: 'Attendee has not checked in yet.' }); return;
    }
    if (reg.checkedOut) {
      res.status(409).json({ success: false, message: 'Attendee already checked out.' }); return;
    }

    const now = new Date();
    reg.checkedOut = true;
    reg.checkedOutAt.push(now);
    reg.checkOutCount += 1;
    await reg.save();

    res.json({ success: true, data: reg, message: `✓ Check-out recorded: ${reg.attendeeName}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};
