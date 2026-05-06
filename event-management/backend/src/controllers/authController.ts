import type { Request, Response } from 'express';
import { User } from '../models/User.js';

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, name } = req.body as { username?: string; email?: string; name?: string };

    if (!username?.trim()) {
      res.status(400).json({ success: false, message: 'Username is required.' });
      return;
    }
    if (!email?.trim()) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const usernameClean = username.trim().toLowerCase();
    const emailClean    = email.trim().toLowerCase();
    const nameClean     = (name?.trim()) || usernameClean;

    // Username format: 3-30 chars, alphanumeric + underscores/dots
    if (!/^[a-z0-9_.]{3,30}$/.test(usernameClean)) {
      res.status(400).json({ success: false, message: 'Username must be 3–30 characters and contain only letters, numbers, underscores, or dots.' });
      return;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailClean)) {
      res.status(400).json({ success: false, message: 'Invalid email address.' });
      return;
    }

    const existing = await User.findOne({ $or: [{ username: usernameClean }, { email: emailClean }] }).lean();
    if (existing) {
      if (existing.username === usernameClean) {
        res.status(409).json({ success: false, message: 'Username is already taken.' });
      } else {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      return;
    }

    const user = await User.create({
      username: usernameClean,
      name:     nameClean,
      email:    emailClean,
      role:     'attendee',
      isGuest:  false,
      isVerified: false,
    });

    res.status(201).json({
      success: true,
      data: {
        _id:      user._id,
        username: user.username,
        name:     user.name,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    const asAny = err as Record<string, unknown>;
    if (typeof asAny['code'] === 'number' && asAny['code'] === 11000) {
      res.status(409).json({ success: false, message: 'Username or email is already taken.' });
      return;
    }
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username?: string };

    if (!username?.trim()) {
      res.status(400).json({ success: false, message: 'Username is required.' });
      return;
    }

    const usernameClean = username.trim().toLowerCase();
    const user = await User.findOne({ username: usernameClean }).lean();

    if (!user) {
      res.status(404).json({ success: false, message: 'No account found with that username.' });
      return;
    }

    res.json({
      success: true,
      data: {
        _id:      user._id,
        username: user.username,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        isGuest:  user.isGuest,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/auth/check-username?username= ───────────────────────────────────
export const checkUsername = async (req: Request, res: Response) => {
  try {
    const username = ((req.query['username'] as string | undefined) ?? '').trim().toLowerCase();
    if (!username) {
      res.json({ success: true, available: false, message: 'Username is required.' });
      return;
    }
    const exists = await User.exists({ username });
    res.json({ success: true, available: !exists });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};

// ─── GET /api/auth/user-by-username?username= ─────────────────────────────────
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const username = ((req.query['username'] as string | undefined) ?? '').trim().toLowerCase();
    if (!username) {
      res.status(400).json({ success: false, message: 'Username is required.' });
      return;
    }
    const user = await User.findOne({ username }).select('_id username name email role').lean();
    if (!user) {
      res.status(404).json({ success: false, message: 'No user found with that username.' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
};
