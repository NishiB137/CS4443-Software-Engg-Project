import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  eventId:        mongoose.Types.ObjectId;
  userId:         string;
  attendeeName:   string;
  attendeeEmail:  string;
  attendeePhone?: string;
  ticketTier:     string;
  amountPaid:     number;
  paymentStatus:  'Pending' | 'Completed' | 'Failed' | 'Refunded';
  status:         'pending' | 'confirmed' | 'cancelled';
  formResponses:  Record<string, unknown>;
  registrationDate: Date;
  
  // Attendance tracking — check-in
  checkedIn:      boolean;
  checkedInAt:    Date[];
  checkInCount:   number;
  
  // Attendance tracking — check-out (separate from check-in)
  checkedOut:     boolean;
  checkedOutAt:   Date[];
  checkOutCount:  number;
  
  qrToken?:       string;
}

const registrationSchema = new Schema<IRegistration>({
  eventId:        { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId:         { type: String, required: true },
  attendeeName:   { type: String, required: true, trim: true },
  attendeeEmail:  { type: String, required: true, trim: true, lowercase: true },
  attendeePhone:  { type: String, trim: true },
  ticketTier:     { type: String, required: true, default: 'General' },
  amountPaid:     { type: Number, required: true, default: 0 },
  paymentStatus:  { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  status:         { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  formResponses:  { type: Schema.Types.Mixed, default: {} },
  registrationDate: { type: Date, default: Date.now },

  // Check-in
  checkedIn:      { type: Boolean, default: false },
  checkedInAt:    [{ type: Date }],
  checkInCount:   { type: Number, default: 0 },

  // Check-out
  checkedOut:     { type: Boolean, default: false },
  checkedOutAt:   [{ type: Date }],
  checkOutCount:  { type: Number, default: 0 },

  qrToken:        { type: String },
}, { timestamps: true });

// Prevent duplicate registrations (same email per event)
registrationSchema.index({ eventId: 1, attendeeEmail: 1 }, { unique: true });
registrationSchema.index({ eventId: 1 });
registrationSchema.index({ userId: 1 });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);