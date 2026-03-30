import type { FieldSpec } from '@/services/api';

export const SYSTEM_FIELDS: FieldSpec[] = [
  { key: 'title',            label: 'Event Name',         fieldType: 'text',     required: true,  placeholder: 'e.g. Tech Summit 2026', section: 'basics',   order: 0,  maxLength: 150, form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },
  { key: 'shortDescription', label: 'Short Description',  fieldType: 'text',     required: false, placeholder: 'One-liner for event cards', section: 'basics', order: 1,  maxLength: 300, form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },
  { key: 'description',      label: 'Full Description',   fieldType: 'textarea', required: true,  placeholder: 'Describe your event in detail', section: 'basics', order: 2,  maxLength: 10000, form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },
  { key: 'eventType',        label: 'Event Type',         fieldType: 'select',   required: true,  section: 'basics', order: 3, options: ['conference','workshop','hackathon','concert','exhibition','summit','festival','competition','webinar','other'], form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },
  { key: 'format',           label: 'Event Format',       fieldType: 'select',   required: true,  section: 'basics', order: 4, options: ['physical','virtual','hybrid'], form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },
  { key: 'isFree',           label: 'Free Event',         fieldType: 'toggle',   required: false, defaultValue: 'true', section: 'basics', order: 5, form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },

  { key: 'startDate',        label: 'Start Date',         fieldType: 'date',     required: true,  section: 'datetime', order: 10, form: 'Basic Info', category: 'Date & Time', formOrder: 0, categoryOrder: 1 },
  { key: 'startTime',        label: 'Start Time',         fieldType: 'time',     required: true,  section: 'datetime', order: 11, form: 'Basic Info', category: 'Date & Time', formOrder: 0, categoryOrder: 1 },
  { key: 'endDate',          label: 'End Date',           fieldType: 'date',     required: true,  section: 'datetime', order: 12, form: 'Basic Info', category: 'Date & Time', formOrder: 0, categoryOrder: 1 },
  { key: 'endTime',          label: 'End Time',           fieldType: 'time',     required: true,  section: 'datetime', order: 13, form: 'Basic Info', category: 'Date & Time', formOrder: 0, categoryOrder: 1 },
  { key: 'timezone',         label: 'Timezone',           fieldType: 'select',   required: false, defaultValue: 'Asia/Kolkata', section: 'datetime', order: 14, options: ['Asia/Kolkata','America/New_York','Europe/London','America/Los_Angeles','Asia/Singapore','UTC'], form: 'Basic Info', category: 'Date & Time', formOrder: 0, categoryOrder: 1 },

  { key: 'venue_name',       label: 'Venue Name',         fieldType: 'text',     required: false, placeholder: 'e.g. Convention Center', section: 'venue', order: 20, maxLength: 200, form: 'Basic Info', category: 'Venue', formOrder: 0, categoryOrder: 2 },
  { key: 'venue_address',    label: 'Street Address',     fieldType: 'text',     required: false, placeholder: '123 Main St', section: 'venue', order: 21, maxLength: 200, form: 'Basic Info', category: 'Venue', formOrder: 0, categoryOrder: 2 },
  { key: 'venue_city',       label: 'City',               fieldType: 'text',     required: false, placeholder: 'City', section: 'venue', order: 22, maxLength: 200, form: 'Basic Info', category: 'Venue', formOrder: 0, categoryOrder: 2 },
  { key: 'venue_state',      label: 'State',              fieldType: 'text',     required: false, placeholder: 'State', section: 'venue', order: 23, maxLength: 200, form: 'Basic Info', category: 'Venue', formOrder: 0, categoryOrder: 2 },
  { key: 'venue_country',    label: 'Country',            fieldType: 'text',     required: false, placeholder: 'Country', section: 'venue', order: 24, maxLength: 200, form: 'Basic Info', category: 'Venue', formOrder: 0, categoryOrder: 2 },
  { key: 'onlineLink',       label: 'Online Event Link',  fieldType: 'text',     required: false, placeholder: 'e.g. https://meet.google.com/abc-xyz', section: 'venue', order: 25, helpText: 'Required for virtual and hybrid events', form: 'Basic Info', category: 'Venue', formOrder: 0, categoryOrder: 2 },

  { key: 'maxCapacity',      label: 'Maximum Capacity',   fieldType: 'number',   required: false, placeholder: 'Leave blank for unlimited', min: 1, max: 1000000, section: 'capacity', order: 30, form: 'Basic Info', category: 'Capacity', formOrder: 0, categoryOrder: 3 },
  { key: 'coverImage',       label: 'Event Cover Image',  fieldType: 'file_image', required: false,  section: 'media', order: 50, helpText: 'Recommended size: 1200x600px', form: 'Basic Info', category: 'Media', formOrder: 0, categoryOrder: 4 },
  { key: 'secondaryImages',  label: 'Secondary Images',   fieldType: 'file_image_multiple', required: false, section: 'media', order: 51, helpText: 'Upload up to 5 additional images', form: 'Basic Info', category: 'Media', formOrder: 0, categoryOrder: 4 },
  { key: 'videoUrl',         label: 'Promotional Video',  fieldType: 'file_video', required: false, section: 'media', order: 52, form: 'Basic Info', category: 'Media', formOrder: 0, categoryOrder: 4 },
  { key: 'refundPolicy',     label: 'Refund Policy',      fieldType: 'select',   required: false, section: 'policies', order: 40, options: ['full','partial','no_refund'], defaultValue: 'no_refund', form: 'About this event', category: 'Policies', formOrder: 1, categoryOrder: 0 },
  { key: 'cancellationPolicy', label: 'Cancellation Policy', fieldType: 'textarea', required: false, section: 'policies', order: 41, maxLength: 2000, defaultValue: 'Cancellations are handled by the organizer. Please contact the organizer for changes or refunds.', form: 'About this event', category: 'Policies', formOrder: 1, categoryOrder: 0 },
  { key: 'attendeeMinAge',   label: 'Minimum Attendee Age', fieldType: 'number', required: false, section: 'policies', order: 42, min: 0, max: 120, defaultValue: '0', form: 'About this event', category: 'Policies', formOrder: 1, categoryOrder: 0 },
];

export const SYSTEM_FIELD_KEYS = SYSTEM_FIELDS.map((f) => f.key);

const defaultLayoutBySection: Record<string, { form: string; category: string; formOrder: number; categoryOrder: number }> = {
  basics:   { form: 'Basic Info', category: 'Event Details', formOrder: 0, categoryOrder: 0 },
  datetime: { form: 'Basic Info', category: 'Date & Time',   formOrder: 0, categoryOrder: 1 },
  venue:    { form: 'Basic Info', category: 'Venue',         formOrder: 0, categoryOrder: 2 },
  capacity: { form: 'Basic Info', category: 'Capacity',      formOrder: 0, categoryOrder: 3 },
  policies: { form: 'About this event', category: 'Policies', formOrder: 1, categoryOrder: 0 },
  media:    { form: 'About this event', category: 'Media',    formOrder: 1, categoryOrder: 1 },
  custom:   { form: 'About this event', category: 'Custom',   formOrder: 1, categoryOrder: 2 },
};

export function withDefaultLayout(f: FieldSpec): FieldSpec {
  const def = defaultLayoutBySection[f.section];
  if (!def) return f;
  return {
    ...f,
    form: f.form ?? def.form,
    category: f.category ?? def.category,
    formOrder: f.formOrder ?? def.formOrder,
    categoryOrder: f.categoryOrder ?? def.categoryOrder,
  };
}

export function mergeSystemFields(fields: FieldSpec[]): FieldSpec[] {
  const byKey = new Map(fields.map((f) => [f.key, withDefaultLayout(f)] as const));
  for (const sf of SYSTEM_FIELDS) {
    if (!byKey.has(sf.key)) byKey.set(sf.key, sf);
  }
  return Array.from(byKey.values())
    .map(withDefaultLayout)
    .sort((a, b) =>
      (a.formOrder ?? 0) - (b.formOrder ?? 0)
      || (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0)
      || (a.order ?? 0) - (b.order ?? 0)
    );
}

