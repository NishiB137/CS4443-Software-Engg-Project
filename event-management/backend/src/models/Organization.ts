import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'admin' | 'event_manager' | 'finance_manager' | 'content_manager' | 'marketing_lead' | 'volunteer_coordinator';
    joinedAt: Date;
  }>;
}

const OrganizationSchema = new Schema<IOrganization>({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  logo:        { type: String },
  description: { type: String },
  website:     { type: String },
  owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user:     { type: Schema.Types.ObjectId, ref: 'User' },
    role:     { type: String, enum: ['admin', 'event_manager', 'finance_manager', 'content_manager', 'marketing_lead', 'volunteer_coordinator'], default: 'event_manager' },
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);