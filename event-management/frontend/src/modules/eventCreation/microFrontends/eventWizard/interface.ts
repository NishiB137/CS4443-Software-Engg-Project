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
}

export const EMPTY_SESSION: SessionFormData = {
  title: '',
  description: '',
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
  }>;
  sessionTemplates: Array<{
    title: string;
    sessionType: string;
    defaultDurationMinutes: number;
    description?: string;
  }>;
  customFieldValues: Record<string, string>;

  title: string;
  shortDescription: string;
  description: string;
  eventType: string;
  format: 'physical' | 'virtual' | 'hybrid';
  isFree: boolean;
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
  submitAs: 'draft' | 'published';
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

export const validateStep1 = (data: EventFormData): StepErrors => {
  const errors: StepErrors = {};
  if (!data.template) errors['template'] = 'Please select an event template to continue.';
  return errors;
};

export const validateStep2 = (data: EventFormData): StepErrors => {
  const errors: StepErrors = {};

  if (!data.title.trim())
    errors['title'] = 'Event name is required.';
  else if (data.title.trim().length < LIMITS.title.min)
    errors['title'] = `Event name must be at least ${LIMITS.title.min} characters.`;
  else if (data.title.trim().length > LIMITS.title.max)
    errors['title'] = `Event name cannot exceed ${LIMITS.title.max} characters.`;

  if (data.shortDescription.length > LIMITS.shortDescription.max)
    errors['shortDescription'] = `Short description cannot exceed ${LIMITS.shortDescription.max} characters.`;

  if (!data.description.trim())
    errors['description'] = 'Full description is required.';
  else if (data.description.trim().length < LIMITS.description.min)
    errors['description'] = `Description must be at least ${LIMITS.description.min} characters.`;
  else if (data.description.trim().length > LIMITS.description.max)
    errors['description'] = `Description cannot exceed ${LIMITS.description.max.toLocaleString()} characters.`;

  // ── Dates: both date and time parts required; guard against epoch ──
  const hasStart = data.startDate.trim() !== '' && data.startTime.trim() !== '';
  const hasEnd   = data.endDate.trim()   !== '' && data.endTime.trim()   !== '';

  if (!hasStart)
    errors['startDate'] = 'Start date and time are both required.';

  if (!hasEnd)
    errors['endDate'] = 'End date and time are both required.';

  if (hasStart && hasEnd) {
    const start = new Date(combineDatetime(data.startDate, data.startTime));
    const end   = new Date(combineDatetime(data.endDate,   data.endTime));
    const now   = new Date();

    if (isNaN(start.getTime()) || start.getFullYear() < 2000)
      errors['startDate'] = 'Start date/time is not a valid date.';
    else if (start < now)
      errors['startDate'] = 'Start date and time cannot be in the past.';

    if (isNaN(end.getTime()) || end.getFullYear() < 2000)
      errors['endDate'] = 'End date/time is not a valid date.';
    else if (!errors['startDate'] && end <= start)
      errors['endDate'] = 'End date/time must be after the start date/time.';
  }

  if (data.maxCapacity) {
    const cap = Number(data.maxCapacity);
    if (!Number.isInteger(cap) || cap < LIMITS.maxCapacity.min)
      errors['maxCapacity'] = `Capacity must be a whole number of at least ${LIMITS.maxCapacity.min}.`;
    else if (cap > LIMITS.maxCapacity.max)
      errors['maxCapacity'] = `Capacity cannot exceed ${LIMITS.maxCapacity.max.toLocaleString()}.`;
  }

  if ((data.format === 'virtual' || data.format === 'hybrid') && !data.venue.onlineLink.trim())
    errors['onlineLink'] = 'An online event link is required for virtual / hybrid events.';

  if (data.venue.onlineLink.trim() && !/^https?:\/\/.+/.test(data.venue.onlineLink))
    errors['onlineLink'] = 'Online link must start with http:// or https://';

  const venueFields: Array<keyof typeof data.venue> = ['name', 'address', 'city', 'state', 'country'];
  for (const f of venueFields) {
    if ((data.venue[f] as string).length > LIMITS.venueField.max)
      errors[`venue_${f}`] = `${f.charAt(0).toUpperCase() + f.slice(1)} cannot exceed ${LIMITS.venueField.max} characters.`;
  }

  return errors;
};

export const validateStep3 = (_: EventFormData): StepErrors => ({});

export const validateStep4 = (data: EventFormData): StepErrors => {
  const errors: StepErrors = {};

  if (data.policies.cancellationPolicy.length > LIMITS.cancellationPolicy.max)
    errors['cancellationPolicy'] = `Cancellation policy cannot exceed ${LIMITS.cancellationPolicy.max} characters.`;

  // Validate whenever the field has a non-empty value (including "0")
  if (data.policies.attendeeMinAge.trim() !== '') {
    const age = Number(data.policies.attendeeMinAge);
    if (!Number.isInteger(age) || isNaN(age) || age < LIMITS.attendeeMinAge.min || age > LIMITS.attendeeMinAge.max)
      errors['attendeeMinAge'] = `Minimum age must be a whole number between ${LIMITS.attendeeMinAge.min} and ${LIMITS.attendeeMinAge.max}.`;
  }

  return errors;
};

export const STEP_VALIDATORS = [validateStep1, validateStep2, validateStep3, validateStep4];
