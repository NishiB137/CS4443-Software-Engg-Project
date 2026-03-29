import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  event: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  sessionType: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  room?: string;
  streamUrl?: string;
  speakers: Array<{
    user?: mongoose.Types.ObjectId;
    name?: string;
    bio?: string;
    designation?: string;
    organization?: string;
    avatarUrl?: string;
    topic?: string;
  }>;
  maxAttendees?: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  tags: string[];
  order: number;
  createdBy: mongoose.Types.ObjectId;
  
  // NEW
  templateId?: mongoose.Types.ObjectId;
  customFields: Array<{ key: string; label: string; value: any }>;
}

const SessionSchema = new Schema<ISession>({
  // ... (keep your existing fields)
  event:       { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  sessionType: { type: String, enum: ['keynote', 'panel', 'workshop', 'networking', 'performance', 'competition_round', 'break', 'other'], default: 'other' },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  timezone:  { type: String, default: 'Asia/Kolkata' },
  room:      { type: String },
  streamUrl: { type: String },
  speakers: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, name: { type: String }, bio: { type: String }, designation: { type: String }, organization: { type: String }, avatarUrl: { type: String }, topic: { type: String } }],
  maxAttendees: { type: Number },
  status:       { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
  tags:         [{ type: String }],
  order:        { type: Number, default: 0 },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },

  // NEW
  templateId: { type: Schema.Types.ObjectId, ref: 'EventTemplate', default: null },
  customFields: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

SessionSchema.index({ event: 1 });
SessionSchema.index({ startTime: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);