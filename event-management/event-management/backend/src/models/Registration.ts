import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: string; // Assuming user data comes from an Auth/User Microservice
  attendeeName: string;
  attendeeEmail: string;
  ticketTier: string;
  amountPaid: number;
  paymentStatus: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  registrationDate: Date;
}

const registrationSchema = new Schema<IRegistration>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: String, required: true },
  attendeeName: { type: String, required: true },
  attendeeEmail: { type: String, required: true },
  ticketTier: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  registrationDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);