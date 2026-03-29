import mongoose, { Schema, Document } from 'mongoose';

export interface IUserEventInteraction extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  liked: boolean;
  disliked: boolean;
  bookmarked: boolean;
  viewedAt?: Date;
}

const UserEventInteractionSchema = new Schema<IUserEventInteraction>({
  user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event:      { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  liked:      { type: Boolean, default: false },
  disliked:   { type: Boolean, default: false },
  bookmarked: { type: Boolean, default: false },
  viewedAt:   { type: Date },
}, { timestamps: true });

UserEventInteractionSchema.index({ user: 1, event: 1 }, { unique: true });
UserEventInteractionSchema.index({ user: 1, bookmarked: 1 });

export const UserEventInteraction = mongoose.model<IUserEventInteraction>('UserEventInteraction', UserEventInteractionSchema);