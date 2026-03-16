import { Session } from '../models/Session.js';

export interface CreateSessionBody {
  event: string;
  title: string;
  description?: string;
  sessionType?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  room?: string;
  streamUrl?: string;
  maxAttendees?: number;
  order?: number;
  speakers?: Array<{
    name?: string;
    bio?: string;
    designation?: string;
    organization?: string;
    avatarUrl?: string;
    topic?: string;
  }>;
  tags?: string[];
  createdBy: string;
}

const SESSION_LIMITS = {
  title:       { min: 3, max: 150 },
  description: { max: 2000 },
  maxAttendees: { min: 1, max: 1_000_000 },
  speakerName: { max: 100 },
  speakerBio:  { max: 500 },
};

const validateSessionBody = (body: CreateSessionBody): void => {
  const errors: string[] = [];

  if (!body.title?.trim())
    errors.push('Session title is required.');
  else if (body.title.trim().length < SESSION_LIMITS.title.min)
    errors.push(`Session title must be at least ${SESSION_LIMITS.title.min} characters.`);
  else if (body.title.trim().length > SESSION_LIMITS.title.max)
    errors.push(`Session title cannot exceed ${SESSION_LIMITS.title.max} characters.`);

  if (body.description && body.description.length > SESSION_LIMITS.description.max)
    errors.push(`Session description cannot exceed ${SESSION_LIMITS.description.max} characters.`);

  if (!body.startTime) errors.push('Session start time is required.');
  if (!body.endTime)   errors.push('Session end time is required.');

  if (body.startTime && body.endTime) {
    const s = new Date(body.startTime), e = new Date(body.endTime);
    if (isNaN(s.getTime())) errors.push('Start time is not a valid date.');
    if (isNaN(e.getTime())) errors.push('End time is not a valid date.');
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e <= s)
      errors.push('Session end time must be after start time.');
  }

  if (body.maxAttendees !== undefined) {
    const n = Number(body.maxAttendees);
    if (!Number.isInteger(n) || n < SESSION_LIMITS.maxAttendees.min)
      errors.push(`Max attendees must be a whole number ≥ ${SESSION_LIMITS.maxAttendees.min}.`);
    else if (n > SESSION_LIMITS.maxAttendees.max)
      errors.push(`Max attendees cannot exceed ${SESSION_LIMITS.maxAttendees.max.toLocaleString()}.`);
  }

  if (body.streamUrl && !/^https?:\/\/.+/.test(body.streamUrl))
    errors.push('Stream URL must start with http:// or https://');

  if (body.speakers) {
    body.speakers.forEach((sp, i) => {
      if (sp.name && sp.name.length > SESSION_LIMITS.speakerName.max)
        errors.push(`Speaker ${i + 1} name cannot exceed ${SESSION_LIMITS.speakerName.max} characters.`);
      if (sp.bio && sp.bio.length > SESSION_LIMITS.speakerBio.max)
        errors.push(`Speaker ${i + 1} bio cannot exceed ${SESSION_LIMITS.speakerBio.max} characters.`);
    });
  }

  if (errors.length > 0) throw new Error(errors.join(' | '));
};

export const createSession = async (body: CreateSessionBody) => {
  validateSessionBody(body);
  return Session.create(body);
};

export const getSessionsByEvent = async (eventId: string) => {
  return Session.find({ event: eventId })
    .populate('speakers.user', 'name email avatar')
    .sort({ order: 1, startTime: 1 });
};

export const getSessionById = async (id: string) => {
  return Session.findById(id).populate('speakers.user', 'name email avatar');
};

export const updateSession = async (id: string, body: Partial<CreateSessionBody>) => {
  // Partial validation on update
  if (body.title !== undefined) {
    if (!body.title.trim()) throw new Error('Session title cannot be empty.');
    if (body.title.trim().length < 3)   throw new Error('Session title must be at least 3 characters.');
    if (body.title.trim().length > 150) throw new Error('Session title cannot exceed 150 characters.');
  }
  if (body.startTime && body.endTime) {
    const s = new Date(body.startTime), e = new Date(body.endTime);
    if (e <= s) throw new Error('Session end time must be after start time.');
  }
  if (body.maxAttendees !== undefined) {
    const n = Number(body.maxAttendees);
    if (!Number.isInteger(n) || n < 1) throw new Error('Max attendees must be ≥ 1.');
    if (n > 1_000_000) throw new Error('Max attendees cannot exceed 1,000,000.');
  }

  return Session.findByIdAndUpdate(id, body, { new: true, runValidators: true });
};

export const deleteSession = async (id: string) => {
  return Session.findByIdAndDelete(id);
};

export const assignSpeaker = async (
  sessionId: string,
  speaker: CreateSessionBody['speakers'] extends (infer S)[] | undefined ? S : never
) => {
  return Session.findByIdAndUpdate(
    sessionId,
    { $push: { speakers: speaker } },
    { new: true }
  );
};

export const removeSpeaker = async (sessionId: string, speakerIndex: number) => {
  const session = await Session.findById(sessionId);
  if (!session) return null;
  session.speakers.splice(speakerIndex, 1);
  return session.save();
};
