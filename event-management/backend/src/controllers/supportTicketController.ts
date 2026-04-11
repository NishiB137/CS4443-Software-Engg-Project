import type { Request, Response } from 'express';
import { SupportTicket } from '../models/SupportTicket.js';
import { Event } from '../models/Event.js';

// Helper: Express params can be string | string[] — always get a plain string
const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { event, raisedBy, subject, message } = req.body;
    if (!event || !raisedBy || !subject || !message) {
      res.status(400).json({ success: false, message: 'Missing required fields: event, raisedBy (email), subject, and message are all required.' });
      return;
    }

    // Validate that the event exists — catch CastError for malformed ObjectIds
    let eventDoc;
    try {
      eventDoc = await Event.findById(event).lean();
    } catch {
      res.status(400).json({ success: false, message: 'Invalid event ID format.' });
      return;
    }

    if (!eventDoc) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const ticket = await SupportTicket.create({
      event,
      raisedBy: String(raisedBy).trim().toLowerCase(),
      subject:  String(subject).trim(),
      message:  String(message).trim(),
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};


export const getTicketsByEvent = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'eventId');
    console.log('[SupportTicket] getTicketsByEvent — eventId:', eventId);

    // Use mongoose to ensure we match regardless of ObjectId vs string
    let tickets;
    try {
      const oid = new (await import('mongoose')).default.Types.ObjectId(eventId);
      tickets = await SupportTicket.find({ event: oid }).sort({ createdAt: -1 });
    } catch {
      // Invalid ObjectId format — try string match as fallback
      tickets = await SupportTicket.find({ event: eventId as any }).sort({ createdAt: -1 });
    }

    console.log('[SupportTicket] Found tickets:', tickets.length);
    res.json({ success: true, data: tickets });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

export const getTicketsByEmail = async (req: Request, res: Response) => {
  try {
    const email = param(req, 'email');
    const tickets = await SupportTicket.find({ raisedBy: email })
      .populate('event', 'title coverImage startDate endDate')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

export const resolveTicket = async (req: Request, res: Response) => {
  try {
    const ticketId = param(req, 'id');
    const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status: 'resolved' }, { new: true });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};
