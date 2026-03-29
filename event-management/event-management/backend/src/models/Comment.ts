import mongoose, { Schema, Document } from 'mongoose';

const commentSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: String, required: true }, // From User Service
  userName: { type: String, required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: true }
}, { timestamps: true });

export const Comment = mongoose.model('Comment', commentSchema);