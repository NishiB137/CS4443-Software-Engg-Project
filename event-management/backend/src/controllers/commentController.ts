import type { Request, Response } from 'express';
import { Comment } from '../models/Comment.js';

// Temporary dev user IDs
const DEV_USER_ID = '000000000000000000000001';

// Helper: Express params can be string | string[] — always get a plain string
const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

export const addComment = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'eventId');
    const { content, userId, userName } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }

    const newComment = await Comment.create({
      eventId,
      userId: userId || DEV_USER_ID,
      userName: userName || 'Anonymous',
      content: content.trim()
    });

    res.status(201).json({ success: true, data: newComment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const eventId = param(req, 'eventId');

    const comments = await Comment.find({ eventId, isApproved: true })
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    res.json({ success: true, data: comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};
