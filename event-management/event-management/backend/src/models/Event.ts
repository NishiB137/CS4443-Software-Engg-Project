import mongoose, { Schema, Document } from 'mongoose';

const EventPolicySchema = new Schema({
  refundPolicy:       { type: String, enum: ['full', 'partial', 'no_refund'], default: 'no_refund' },
  cancellationPolicy: { type: String, maxlength: 2000 },
  privacyPolicy:      { type: String, maxlength: 2000 },
  termsAndConditions: { type: String, maxlength: 5000 },
  attendeeMinAge:     { type: Number, default: 0 },
  codeOfConduct:      { type: String, maxlength: 3000 },
}, { _id: false });

const ChangeLogEntrySchema = new Schema({
  changedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  changedAt:   { type: Date, default: Date.now },
  field:       { type: String },
  oldValue:    { type: Schema.Types.Mixed },
  newValue:    { type: Schema.Types.Mixed },
  description: { type: String },
}, { _id: false });

export interface IEvent extends Document {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  coverImage?: string;
  bannerImage?: string;
  media: { videoUrl?: string; logo?: string };

  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  parentEvent?: mongoose.Types.ObjectId;
  eventLevel: 'main' | 'sub';

  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  tags: mongoose.Types.ObjectId[];
  isFree: boolean;

  venue: {
    name?: string; address?: string; city?: string; state?: string;
    country?: string; postalCode?: string;
    coordinates?: { lat: number; lng: number };
    onlineLink?: string;
  };

  startDate: Date;
  endDate: Date;
  timezone: string;
  registrationOpenDate?: Date;
  registrationCloseDate?: Date;

  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';
  visibility: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';

  team: Array<{ user: mongoose.Types.ObjectId; role: string; assignedAt: Date }>;
  policies: any;
  
  maxCapacity?: number;
  registrationCount: number;
  pricing: { basePrice: number; discountPercentage: number };
  ticketingTiers: Array<{ name: string; price: number; capacity: number; duration?: string; description?: string }>;
  
  organizerName: string;
  pocDetails: { name: string; email: string; phone?: string };
  sponsors: Array<{ name: string; logoUrl: string; bannerUrl?: string; website?: string }>;
  isCommentsEnabled: boolean;
  faqs: Array<{ question: string; answer: string }>;

  analytics: { 
    likes: number; bookmarks: number; views: number; registrations: number; shareCount: number 
  };

  templateId?: mongoose.Types.ObjectId;
  // NEW: Dynamic Custom Fields
  customFields: Array<{ key: string; label: string; value: any }>;
  
  changeLog: any[];
  metaTitle?: string;
  metaDescription?: string;
  customUrl?: string;
}

const EventSchema = new Schema<IEvent>({
  // ... (keep all your existing EventSchema fields exactly the same)
  title:            { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  shortDescription: { type: String, maxlength: 300 },
  description:      { type: String },
  coverImage:       { type: String },
  bannerImage:      { type: String },
  media: { videoUrl: { type: String }, logo: { type: String } },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentEvent:  { type: Schema.Types.ObjectId, ref: 'Event', default: null },
  eventLevel:   { type: String, enum: ['main', 'sub'], default: 'main' },
  eventType: { type: String, enum: ['conference', 'workshop', 'hackathon', 'concert', 'exhibition', 'summit', 'festival', 'competition', 'webinar', 'other'], default: 'other' },
  format:    { type: String, enum: ['physical', 'virtual', 'hybrid'], default: 'physical' },
  tags:      [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  isFree:    { type: Boolean, default: false },
  venue: { name: { type: String }, address: { type: String }, city: { type: String }, state: { type: String }, country: { type: String }, postalCode: { type: String }, coordinates: { lat: { type: Number }, lng: { type: Number } }, onlineLink: { type: String } },
  startDate:             { type: Date, required: true },
  endDate:               { type: Date, required: true },
  timezone:              { type: String, default: 'Asia/Kolkata' },
  registrationOpenDate:  { type: Date },
  registrationCloseDate: { type: Date },
  status:     { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'archived'], default: 'draft' },
  visibility: { type: String, enum: ['public', 'restricted', 'hidden_link', 'hidden_authenticated'], default: 'public' },
  team: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'event_manager' }, assignedAt: { type: Date, default: Date.now } }],
  policies: { type: EventPolicySchema, default: () => ({}) },
  maxCapacity:       { type: Number },
  registrationCount: { type: Number, default: 0 },
  pricing: { basePrice: { type: Number, default: 0 }, discountPercentage: { type: Number, default: 0 } },
  ticketingTiers: [{ name: { type: String, required: true }, price: { type: Number, required: true }, capacity: { type: Number, required: true }, duration: { type: String }, description: { type: String } }],
  organizerName: { type: String },
  pocDetails: { name: { type: String }, email: { type: String }, phone: { type: String } },
  sponsors: [{ name: { type: String }, logoUrl: { type: String }, bannerUrl: { type: String }, website: { type: String } }],
  isCommentsEnabled: { type: Boolean, default: true },
  faqs: [{ question: { type: String }, answer: { type: String } }],
  analytics: { likes: { type: Number, default: 0 }, bookmarks: { type: Number, default: 0 }, views: { type: Number, default: 0 }, registrations: { type: Number, default: 0 }, shareCount: { type: Number, default: 0 } },
  templateId: { type: Schema.Types.ObjectId, ref: 'EventTemplate', default: null },
  changeLog:  [ChangeLogEntrySchema],
  metaTitle:       { type: String },
  metaDescription: { type: String },
  customUrl:       { type: String },

  // NEW: Dynamic Custom Fields Schema Definition
  customFields: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

EventSchema.index({ status: 1 });
EventSchema.index({ visibility: 1 });
EventSchema.index({ isFree: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ organization: 1 });
EventSchema.index({ parentEvent: 1 });
EventSchema.index({ title: 'text', shortDescription: 'text' });

export const Event = mongoose.model<IEvent>('Event', EventSchema);