import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ISupportTicket extends Document {
  event: Types.ObjectId;
  raisedBy: string; // Email or name provided by the user
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    raisedBy: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
