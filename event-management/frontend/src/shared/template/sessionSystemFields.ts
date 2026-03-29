import type { FieldSpec, TemplateLayout } from '@/services/api';

export const SESSION_SYSTEM_FIELDS: FieldSpec[] = [
  { key: 'title', label: 'Session Title', fieldType: 'text', required: true, section: 'basics', order: 0, form: 'Session Details', category: 'General' },
  { key: 'sessionType', label: 'Session Type', fieldType: 'select', required: true, options: ['keynote', 'panel', 'workshop', 'networking', 'performance', 'competition_round', 'break', 'other'], defaultValue: 'other', section: 'basics', order: 1, form: 'Session Details', category: 'General' },
  { key: 'description', label: 'Description', fieldType: 'textarea', required: false, maxLength: 1000, section: 'basics', order: 2, form: 'Session Details', category: 'General' },
  { key: 'notes', label: 'Remarks / Notes', fieldType: 'textarea', required: false, maxLength: 500, section: 'basics', order: 3, form: 'Session Details', category: 'General' },
  { key: 'defaultDurationMinutes', label: 'Default Duration (minutes)', fieldType: 'number', required: false, min: 5, max: 1440, defaultValue: '60', section: 'basics', order: 4, form: 'Session Details', category: 'General' },

  { key: 'startDate', label: 'Start Date', fieldType: 'date', required: true, section: 'datetime', order: 0, form: 'Session Details', category: 'Date & Time' },
  { key: 'startTime', label: 'Start Time', fieldType: 'time', required: true, section: 'datetime', order: 1, form: 'Session Details', category: 'Date & Time' },
  { key: 'endDate', label: 'End Date', fieldType: 'date', required: true, section: 'datetime', order: 2, form: 'Session Details', category: 'Date & Time' },
  { key: 'endTime', label: 'End Time', fieldType: 'time', required: true, section: 'datetime', order: 3, form: 'Session Details', category: 'Date & Time' },

  { key: 'room', label: 'Room / Hall', fieldType: 'text', required: false, section: 'venue', order: 0, form: 'Session Details', category: 'Location' },
  { key: 'maxAttendees', label: 'Max Attendees', fieldType: 'number', required: false, min: 1, section: 'capacity', order: 0, form: 'Session Details', category: 'Location' },

  { key: 'speakers', label: 'Speakers', fieldType: 'speakers', required: false, section: 'custom', order: 0, form: 'Speakers & Meeting', category: 'Manage Speakers' },
  
  { key: 'streamUrl', label: 'Meeting Link / Stream URL', fieldType: 'text', required: false, defaultValue: 'Link will be shared soon', section: 'venue', order: 1, form: 'Speakers & Meeting', category: 'Meeting Link' },
];

export const SESSION_SYSTEM_FIELD_KEYS = SESSION_SYSTEM_FIELDS.map((f) => f.key);

export const DEFAULT_SESSION_LAYOUT: TemplateLayout = {
  forms: [
    {
      name: 'Session Details',
      order: 0,
      categories: [
        { name: 'General', order: 0 },
        { name: 'Date & Time', order: 1 },
        { name: 'Location', order: 2 }
      ]
    },
    {
      name: 'Speakers & Meeting',
      order: 1,
      categories: [
        { name: 'Manage Speakers', order: 0 },
        { name: 'Meeting Link', order: 1 }
      ]
    }
  ]
};

export function mergeSessionSystemFields(customFields: FieldSpec[] = []): FieldSpec[] {
  const merged = [...customFields];
  SESSION_SYSTEM_FIELDS.forEach((sysField) => {
    const existingIdx = merged.findIndex((f) => f.key === sysField.key);
    if (existingIdx >= 0) {
      merged[existingIdx] = { ...sysField, ...merged[existingIdx], required: sysField.required, fieldType: sysField.fieldType, options: sysField.options };
    } else {
      merged.push(sysField);
    }
  });
  return merged;
}
