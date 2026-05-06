import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';

// These IDs must match the hard-coded DEV_* IDs used by controllers.
export const DEV_USER_ID = '000000000000000000000001';
export const DEV_ORG_ID = '000000000000000000000002';

/**
 * Ensures the dev bootstrap User + Organization exist.
 * Safe to call repeatedly (idempotent).
 */
export async function ensureDevBootstrap(): Promise<void> {
  const userId = new mongoose.Types.ObjectId(DEV_USER_ID);
  const orgId = new mongoose.Types.ObjectId(DEV_ORG_ID);

  // ── User ───────────────────────────────────────────────────────────────────
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    await User.create({
      _id: userId,
      username: 'devuser',
      name: 'Dev User',
      email: 'dev@eventa.local',
      role: 'organizer',
      isVerified: true,
      interests: [],
      avatar: 'https://ui-avatars.com/api/?name=Dev+User&background=2563EB&color=fff',
    });
    console.log('[bootstrap] Created default dev user');
  }

  // ── Organization ───────────────────────────────────────────────────────────
  const existingOrg = await Organization.findById(orgId);
  if (!existingOrg) {
    await Organization.create({
      _id: orgId,
      name: 'Eventa Default Org',
      slug: 'eventa-default-org',
      description: 'Default organization used during development (no auth).',
      owner: userId,
      members: [{ user: userId, role: 'admin' }],
    });
    console.log('[bootstrap] Created default dev organization');
  }
}

