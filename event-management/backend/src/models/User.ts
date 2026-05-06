import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  role: 'attendee' | 'organizer' | 'superadmin';
  isVerified: boolean;
  isGuest: boolean;       // auto-created account for unregistered attendees
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String }, // nullable for SSO-only / guest users
  avatar:       { type: String }, // S3 URL
  role:         { type: String, enum: ['attendee', 'organizer', 'superadmin'], default: 'attendee' },
  isVerified:   { type: Boolean, default: false },
  isGuest:      { type: Boolean, default: false },
  interests:    [{ type: String }], // tag slugs for recommendations
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);