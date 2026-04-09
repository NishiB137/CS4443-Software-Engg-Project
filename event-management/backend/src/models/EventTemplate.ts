import mongoose, { Schema, Document } from 'mongoose';

// ─── Custom field definition ──────────────────────────────────────────────────
// Templates carry a list of "field specs" that tell the creation wizard
// which fields to show, their type, label, default value, and constraints.

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime'
  | 'select' | 'multiselect' | 'toggle' | 'url' | 'email' | 'phone' | 'speakers'
  | 'file_image' | 'file_video' | 'file_image_multiple';

export interface IFieldSpec {
  key: string;           // unique camelCase key, maps to EventFormData field
  label: string;         // display label
  fieldType: FieldType;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[];    // for select / multiselect
  min?: number;          // for number / date
  max?: number;
  maxLength?: number;    // for text / textarea
  section: 'basics' | 'datetime' | 'venue' | 'capacity' | 'policies' | 'media' | 'custom';
  order: number;         // display order within section
  /** Optional layout metadata for grouping fields in the builder & wizard. */
  form?: string;         // e.g. "Basic Info", "About this event"
  category?: string;     // e.g. "Venue", "Capacity"
  formOrder?: number;    // ordering between forms
  categoryOrder?: number;// ordering between categories (within a form)
}

// ─── Session template ─────────────────────────────────────────────────────────
export interface ISessionTemplate {
  title: string;
  sessionType: string;
  defaultDurationMinutes: number;
  description?: string;
  defaultFields: IFieldSpec[];
  layout?: any;
}

// ─── Main interface ───────────────────────────────────────────────────────────
export interface IEventTemplate extends Document {
  name: string;
  description: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
  isDefault: boolean;           // seeded system template — cannot be deleted
  isSystemTemplate: boolean;    // same flag, prevents certain edits
  createdBy?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;

  // Fields shown in the event creation wizard
  fields: IFieldSpec[];

  /** Optional saved layout for form/category grouping (allows empty forms/categories). */
  layout?: {
    forms: Array<{
      name: string;
      order: number;
      categories: Array<{
        name: string;
        order: number;
      }>;
    }>;
  };

  // Default visibility / lifecycle
  defaultVisibility: string;
  defaultStatus: string;

  // Default policy values
  defaultPolicies: {
    refundPolicy?: string;
    cancellationPolicy?: string;
    attendeeMinAge?: number;
  };

  // Session templates bundled with this event template
  sessionTemplates: ISessionTemplate[];

  // Sub-event config
  allowsSubEvents: boolean;
  maxSubEventDepth: number;       // 1 = only one level of sub-events

  // Metadata
  coverColor: string;             // hex colour used in the template card
  tags: string[];
  usageCount: number;
  version: number;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const FieldSpecSchema = new Schema<IFieldSpec>({
  key:          { type: String, required: true },
  label:        { type: String, required: true },
  fieldType:    { type: String, required: true, enum: ['text','textarea','number','date','time','datetime','select','multiselect','toggle','url','email','phone','speakers', 'file_image', 'file_video', 'file_image_multiple'] },
  required:     { type: Boolean, default: false },
  defaultValue: { type: String },
  placeholder:  { type: String },
  helpText:     { type: String },
  options:      [{ type: String }],
  min:          { type: Number },
  max:          { type: Number },
  maxLength:    { type: Number },
  section:      { type: String, enum: ['basics','datetime','venue','capacity','policies','media','custom'], default: 'basics' },
  order:        { type: Number, default: 0 },
  form:         { type: String },
  category:     { type: String },
  formOrder:    { type: Number },
  categoryOrder:{ type: Number },
}, { _id: false });

const LayoutCategorySchema = new Schema<{ name: string; order: number }>({
  name:  { type: String, required: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const LayoutFormSchema = new Schema<{ name: string; order: number; categories: Array<{ name: string; order: number }> }>({
  name:       { type: String, required: true },
  order:      { type: Number, default: 0 },
  categories: { type: [LayoutCategorySchema], default: [] },
}, { _id: false });

const TemplateLayoutSchema = new Schema<{ forms: Array<{ name: string; order: number; categories: Array<{ name: string; order: number }> }> }>({
  forms: { type: [LayoutFormSchema], default: [] },
}, { _id: false });

const SessionTemplateSchema = new Schema<ISessionTemplate>({
  title:                  { type: String, required: true },
  sessionType:            { type: String, default: 'other' },
  defaultDurationMinutes: { type: Number, default: 60 },
  description:            { type: String },
  defaultFields:          [FieldSpecSchema],
  layout:                 { type: TemplateLayoutSchema, required: false },
}, { _id: false });

const EventTemplateSchema = new Schema<IEventTemplate>({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  eventType:   { type: String, default: 'other' },
  format:      { type: String, enum: ['physical','virtual','hybrid'], default: 'physical' },
  isFree:      { type: Boolean, default: true },

  isDefault:        { type: Boolean, default: false },
  isSystemTemplate: { type: Boolean, default: false },

  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },

  fields: [FieldSpecSchema],
  layout: { type: TemplateLayoutSchema, required: false },

  defaultVisibility: { type: String, default: 'public' },
  defaultStatus:     { type: String, default: 'draft' },

  defaultPolicies: {
    refundPolicy:       { type: String },
    cancellationPolicy: { type: String },
    attendeeMinAge:     { type: Number, default: 0 },
  },

  sessionTemplates: [SessionTemplateSchema],

  allowsSubEvents:   { type: Boolean, default: true },
  maxSubEventDepth:  { type: Number, default: 1 },

  coverColor: { type: String, default: '#3B82F6' },
  tags:       [{ type: String }],
  usageCount: { type: Number, default: 0 },
  version:    { type: Number, default: 1 },
}, { timestamps: true });

EventTemplateSchema.index({ isDefault: 1 });
EventTemplateSchema.index({ eventType: 1 });
EventTemplateSchema.index({ organization: 1 });

export const EventTemplate = mongoose.model<IEventTemplate>('EventTemplate', EventTemplateSchema);
