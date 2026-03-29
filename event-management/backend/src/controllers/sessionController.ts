import type { Request, Response } from 'express';
import * as sessionService from '../services/sessionService.js';

const DEV_USER_ID = '000000000000000000000001';

// Helper: Express params can be string | string[] — always get a plain string
const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

export const createSession = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const session = await sessionService.createSession({
      ...req.body,
      event: eventId,
      createdBy: req.body.createdBy || DEV_USER_ID,
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// ─── GET /api/events/:eventId/sessions ───────────────────────────────────────
export const getSessionsByEvent = async (req: Request, res: Response) => {
  try {
    const sessions = await sessionService.getSessionsByEvent(param(req, 'eventId'));
    res.json({ success: true, data: sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── PUT /api/sessions/:id ────────────────────────────────────────────────────
export const updateSession = async (req: Request, res: Response) => {
  try {
    const session = await sessionService.updateSession(param(req, 'id'), req.body);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, message });
  }
};

// ─── DELETE /api/sessions/:id ─────────────────────────────────────────────────
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const session = await sessionService.deleteSession(param(req, 'id'));
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/sessions/:id/speakers ─────────────────────────────────────────
export const assignSpeaker = async (req: Request, res: Response) => {
  try {
    const session = await sessionService.assignSpeaker(param(req, 'id'), req.body);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, message });
  }
};