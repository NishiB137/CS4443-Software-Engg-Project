import type { FieldSpec, TemplateLayout } from '@/services/api';

// Full form data shape that maps 1-to-1 with the backend CreateEventPayload.
// Each wizard step works on a slice of this interface.

// ─── Session types ────────────────────────────────────────────────────────────

export interface SessionSpeaker {
  name: string;
  designation: string;
  organization: string;
  bio: string;
  topic: string;
}

export interface SessionFormData {
  title: string;
  description: string;
  notes: string;
  sessionType: 'keynote' | 'panel' | 'workshop' | 'networking' | 'performance' | 'competition_round' | 'break' | 'other';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  room: string;
  streamUrl: string;
  maxAttendees: string;
  speakers: SessionSpeaker[];
  tags: string[];
  customFieldValues: Record<string, string>;
  templateId?: string;
  templateFields?: FieldSpec[];
  templateLayout?: TemplateLayout;
}

export const EMPTY_SESSION: SessionFormData = {
  title: '',
  description: '',
  notes: '',
  sessionType: 'other',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  room: '',
  streamUrl: '',
  maxAttendees: '',
  speakers: [],
  tags: [],
  customFieldValues: {},
};

// ─── Validation limits ────────────────────────────────────────────────────────

export const LIMITS = {
  title: { min: 3, max: 150 },
  shortDescription: { max: 300 },
  description: { min: 20, max: 10000 },
  maxCapacity: { min: 1, max: 1000000 },
  attendeeMinAge: { min: 0, max: 120 },
  cancellationPolicy: { max: 2000 },
  sessionTitle: { min: 3, max: 150 },
  sessionDescription: { max: 2000 },
  sessionMaxAttendees: { min: 1, max: 1000000 },
  faqQuestion: { min: 5, max: 300 },
  faqAnswer: { min: 5, max: 1000 },
  venueField: { max: 200 },
  speakerName: { max: 100 },
  speakerBio: { max: 500 },
  speakerTopic: { max: 200 },
} as const;

// ─── Main event form data ─────────────────────────────────────────────────────

export interface EventFormData {
  template: string;
  templateName: string;
  templateFields: Array<{
    key: string;
    label: string;
    fieldType: string;
    required: boolean;
    defaultValue?: string;
    placeholder?: string;
    helpText?: string;
    options?: string[];
    min?: number;
    max?: number;
    maxLength?: number;
    section: string;
    order: number;
    form?: string;
    category?: string;
    formOrder?: number;
    categoryOrder?: number;
  }>;
  sessionTemplates: Array<{
    title: string;
    sessionType: string;
    defaultDurationMinutes: number;
    description?: string;
    defaultFields?: FieldSpec[];
    layout?: TemplateLayout;
  }>;
  customFieldValues: Record<string, string>;
  templateLayout?: TemplateLayout;

  title: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  secondaryImages: string[];
  videoUrl: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
  tags: string[];
  notes: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  maxCapacity: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    onlineLink: string;
    shareOnlineLinkLater?: string;
  };
  visibility: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';
  policies: {
    refundPolicy: 'full' | 'partial' | 'no_refund' | '';
    cancellationPolicy: string;
    attendeeMinAge: string;
  };
  organizerName: string;
  pocDetails: { name: string; email: string; phone: string };
  faqs: Array<{ question: string; answer: string }>;
  sessions: SessionFormData[];
  submitAs: 'draft' | 'review' | 'approved' | 'published' | 'ongoing' | 'completed' | 'archived';
}

export type StepErrors = Partial<Record<string, string>>;

export interface WizardStepProps {
  data: EventFormData;
  updateData: (fields: Partial<EventFormData>) => void;
  errors?: StepErrors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const combineDatetime = (date: string, time: string): string => {
  if (!date || !time) return '';
  return `${date}T${time}`;
};

export const todayDate = (): string => new Date().toISOString().slice(0, 10);

export const currentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// ─── Validation rules per step ────────────────────────────────────────────────

export interface StepDef {
  id: string;
  title: string;
  type: 'template' | 'form' | 'visibility' | 'sessions' | 'faq' | 'review';
  formName?: string;
}

export const validateStep1 = (data: EventFormData): StepErrors => {
  const errors: StepErrors = {};
  if (!data.template) errors['template'] = 'Please select an event template to continue.';
  return errors;
};

export const validateStep4 = (data: EventFormData): StepErrors => {
  const errors: StepErrors = {};
  data.sessions.forEach((s, idx) => {
    if (!s.title.trim()) errors[`session_${idx}_title`] = `Session ${idx + 1}: title is required.`;
    if (!s.startDate || !s.startTime) errors[`session_${idx}_start`] = `Session ${idx + 1}: start date/time is required.`;
    if (!s.endDate || !s.endTime) errors[`session_${idx}_end`] = `Session ${idx + 1}: end date/time is required.`;
  });
  return errors;
};

export const validateStep = (step: StepDef, data: EventFormData): StepErrors => {
  if (step.type === 'template') return validateStep1(data);
  if (step.type === 'visibility') return {};
  if (step.type === 'sessions') return validateStep4(data);
  if (step.type === 'review') return {};

  if (step.type === 'form' && step.formName) {
    const errors: StepErrors = {};
    const fieldsInForm = data.templateFields.filter(f => f.form === step.formName);
    const fieldKeys = new Set(fieldsInForm.map(f => f.key));

    for (const f of fieldsInForm) {
      const val = ['title', 'description', 'shortDescription', 'eventType', 'format', 'isFree', 'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'maxCapacity', 'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country', 'onlineLink', 'shareOnlineLinkLater', 'refundPolicy', 'cancellationPolicy', 'attendeeMinAge', 'coverImage', 'secondaryImages', 'videoUrl'].includes(f.key)
        ? (() => {
            if (f.key.startsWith('venue_')) return data.venue[f.key.replace('venue_', '') as keyof typeof data.venue];
            if (f.key === 'refundPolicy' || f.key === 'cancellationPolicy' || f.key === 'attendeeMinAge') return data.policies[f.key as keyof typeof data.policies];
            if (f.key === 'shareOnlineLinkLater') return data.venue.shareOnlineLinkLater;
            return (data as any)[f.key];
          })()
        : data.customFieldValues[f.key];

      const strVal = String(val ?? '').trim();

      if (f.required && !strVal) {
        errors[f.key] = `${f.label} is required.`;
      }
      if (f.maxLength && strVal.length > f.maxLength) {
        errors[f.key] = `${f.label} cannot exceed ${f.maxLength} characters.`;
      }
      if (f.fieldType === 'number' && strVal) {
        const numVal = Number(strVal);
        const mn = typeof f.min === 'number' ? f.min : (LIMITS[f.key as keyof typeof LIMITS] as any)?.min;
        const mx = typeof f.max === 'number' ? f.max : (LIMITS[f.key as keyof typeof LIMITS] as any)?.max;
        if (mn !== undefined && numVal < mn) errors[f.key] = `${f.label} minimum is ${mn}.`;
        if (mx !== undefined && numVal > mx) errors[f.key] = `${f.label} cannot exceed ${mx}.`;
      }
    }

    if (fieldKeys.has('title') && data.title.trim() && data.title.trim().length < LIMITS.title.min)
      errors['title'] = `Event name must be at least ${LIMITS.title.min} characters.`;

    if (fieldKeys.has('description') && data.description.trim() && data.description.trim().length < LIMITS.description.min)
      errors['description'] = `Description must be at least ${LIMITS.description.min} characters.`;

    const hasStart = fieldKeys.has('startDate') || fieldKeys.has('startTime');
    const hasEnd = fieldKeys.has('endDate') || fieldKeys.has('endTime');

    if (hasStart || hasEnd) {
      const startStr = data.startDate.trim() !== '' && data.startTime.trim() !== '' ? combineDatetime(data.startDate, data.startTime) : null;
      const endStr = data.endDate.trim() !== '' && data.endTime.trim() !== '' ? combineDatetime(data.endDate, data.endTime) : null;

      const start = startStr ? new Date(startStr) : null;
      const end = endStr ? new Date(endStr) : null;
      const now = new Date();

      if (hasStart && start) {
        if (isNaN(start.getTime()) || start.getFullYear() < 2000) errors['startDate'] = 'Start date/time is not a valid date.';
        else if (start < now) errors['startDate'] = 'Start date and time cannot be in the past.';
      }

      if (hasEnd && end) {
        if (isNaN(end.getTime()) || end.getFullYear() < 2000) errors['endDate'] = 'End date/time is not a valid date.';
        else if (startStr && !errors['startDate'] && start && end <= start) errors['endDate'] = 'End date/time must be after the start date/time.';
      }
    }

    return errors;
  }

  return {};
};
