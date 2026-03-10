import { EventTemplate } from '../models/EventTemplate.js';
import type { IFieldSpec, ISessionTemplate } from '../models/EventTemplate.js';

// ─── Shared core fields used by most templates ────────────────────────────────

const coreBasicsFields = (order = 0): IFieldSpec[] => [
  { key: 'title',            label: 'Event Name',         fieldType: 'text',     required: true,  placeholder: 'e.g. Tech Summit 2026',    section: 'basics',  order: order + 0, maxLength: 150 },
  { key: 'shortDescription', label: 'Short Description',  fieldType: 'text',     required: false, placeholder: 'One-liner for event cards', section: 'basics',  order: order + 1, maxLength: 300 },
  { key: 'description',      label: 'Full Description',   fieldType: 'textarea', required: true,  placeholder: 'Describe your event in detail', section: 'basics', order: order + 2, maxLength: 10000 },
  { key: 'eventType',        label: 'Event Type',         fieldType: 'select',   required: true,  section: 'basics',  order: order + 3, options: ['conference','workshop','hackathon','concert','exhibition','summit','festival','competition','webinar','other'] },
  { key: 'format',           label: 'Event Format',       fieldType: 'select',   required: true,  section: 'basics',  order: order + 4, options: ['physical','virtual','hybrid'] },
  { key: 'isFree',           label: 'Free Event',         fieldType: 'toggle',   required: false, defaultValue: 'true', section: 'basics', order: order + 5 },
];

const coreDateFields = (order = 10): IFieldSpec[] => [
  { key: 'startDate', label: 'Start Date', fieldType: 'date', required: true, section: 'datetime', order: order + 0 },
  { key: 'startTime', label: 'Start Time', fieldType: 'time', required: true, section: 'datetime', order: order + 1 },
  { key: 'endDate',   label: 'End Date',   fieldType: 'date', required: true, section: 'datetime', order: order + 2 },
  { key: 'endTime',   label: 'End Time',   fieldType: 'time', required: true, section: 'datetime', order: order + 3 },
  { key: 'timezone',  label: 'Timezone',   fieldType: 'select', required: false, defaultValue: 'Asia/Kolkata', section: 'datetime', order: order + 4, options: ['Asia/Kolkata','America/New_York','Europe/London','America/Los_Angeles','Asia/Singapore','UTC'] },
];

const coreVenueFields = (order = 20): IFieldSpec[] => [
  { key: 'venue_name',    label: 'Venue Name',    fieldType: 'text', required: false, placeholder: 'e.g. Grand Convention Center', section: 'venue', order: order + 0, maxLength: 200 },
  { key: 'venue_address', label: 'Street Address',fieldType: 'text', required: false, placeholder: '123 Main St',                  section: 'venue', order: order + 1, maxLength: 200 },
  { key: 'venue_city',    label: 'City',          fieldType: 'text', required: false, placeholder: 'City',                         section: 'venue', order: order + 2, maxLength: 200 },
  { key: 'venue_state',   label: 'State',         fieldType: 'text', required: false, placeholder: 'State',                        section: 'venue', order: order + 3, maxLength: 200 },
  { key: 'venue_country', label: 'Country',       fieldType: 'text', required: false, placeholder: 'Country',                      section: 'venue', order: order + 4, maxLength: 200 },
];

const capacityField = (order = 30): IFieldSpec => ({
  key: 'maxCapacity', label: 'Maximum Capacity', fieldType: 'number', required: false,
  placeholder: 'Leave blank for unlimited', min: 1, max: 1000000, section: 'capacity', order,
});

const policyFields = (order = 40): IFieldSpec[] => [
  { key: 'refundPolicy',       label: 'Refund Policy',      fieldType: 'select',   required: false, section: 'policies', order: order + 0, options: ['full','partial','no_refund'] },
  { key: 'cancellationPolicy', label: 'Cancellation Policy',fieldType: 'textarea', required: false, section: 'policies', order: order + 1, maxLength: 2000 },
  { key: 'attendeeMinAge',     label: 'Minimum Attendee Age',fieldType: 'number',  required: false, defaultValue: '0',   section: 'policies', order: order + 2, min: 0, max: 120 },
];

const onlineLinkField = (order = 25): IFieldSpec => ({
  key: 'onlineLink', label: 'Online Event Link', fieldType: 'url', required: true,
  placeholder: 'https://zoom.us/j/...', section: 'venue', order, helpText: 'Required for virtual and hybrid events',
});

// ─── Session templates ────────────────────────────────────────────────────────

const keynoteSessionTemplate = (): ISessionTemplate => ({
  title: 'Keynote Session',
  sessionType: 'keynote',
  defaultDurationMinutes: 60,
  description: 'Main stage keynote with a single speaker',
  defaultFields: [
    { key: 'title',       label: 'Session Title',    fieldType: 'text',     required: true,  section: 'basics', order: 0 },
    { key: 'description', label: 'Description',      fieldType: 'textarea', required: false, section: 'basics', order: 1 },
    { key: 'room',        label: 'Stage / Hall',     fieldType: 'text',     required: false, section: 'venue',  order: 2 },
    { key: 'streamUrl',   label: 'Live Stream URL',  fieldType: 'url',      required: false, section: 'venue',  order: 3 },
  ],
});

const panelSessionTemplate = (): ISessionTemplate => ({
  title: 'Panel Discussion',
  sessionType: 'panel',
  defaultDurationMinutes: 45,
  description: 'Multi-speaker discussion panel',
  defaultFields: [
    { key: 'title',        label: 'Panel Title',       fieldType: 'text',     required: true,  section: 'basics', order: 0 },
    { key: 'description',  label: 'Panel Topic',       fieldType: 'textarea', required: false, section: 'basics', order: 1 },
    { key: 'room',         label: 'Room',              fieldType: 'text',     required: false, section: 'venue',  order: 2 },
    { key: 'maxAttendees', label: 'Max Attendees',     fieldType: 'number',   required: false, section: 'capacity', order: 3, min: 1 },
  ],
});

const workshopSessionTemplate = (): ISessionTemplate => ({
  title: 'Hands-on Workshop',
  sessionType: 'workshop',
  defaultDurationMinutes: 120,
  description: 'Interactive workshop with limited seats',
  defaultFields: [
    { key: 'title',        label: 'Workshop Title',  fieldType: 'text',     required: true,  section: 'basics', order: 0 },
    { key: 'description',  label: 'What Youll Learn',fieldType: 'textarea', required: false, section: 'basics', order: 1 },
    { key: 'room',         label: 'Lab / Room',      fieldType: 'text',     required: false, section: 'venue',  order: 2 },
    { key: 'maxAttendees', label: 'Seats Available', fieldType: 'number',   required: true,  section: 'capacity', order: 3, min: 1, max: 100 },
  ],
});

const networkingSessionTemplate = (): ISessionTemplate => ({
  title: 'Networking Break',
  sessionType: 'networking',
  defaultDurationMinutes: 30,
  description: 'Unstructured networking time for attendees',
  defaultFields: [
    { key: 'title',       label: 'Session Name', fieldType: 'text',     required: true,  section: 'basics', order: 0 },
    { key: 'description', label: 'Details',      fieldType: 'textarea', required: false, section: 'basics', order: 1 },
    { key: 'room',        label: 'Area',         fieldType: 'text',     required: false, section: 'venue',  order: 2 },
  ],
});

const breakSessionTemplate = (): ISessionTemplate => ({
  title: 'Break / Intermission',
  sessionType: 'break',
  defaultDurationMinutes: 15,
  description: 'Short break between sessions',
  defaultFields: [
    { key: 'title', label: 'Break Name', fieldType: 'text', required: true, section: 'basics', order: 0, defaultValue: 'Break' },
    { key: 'room',  label: 'Area',       fieldType: 'text', required: false, section: 'venue', order: 1 },
  ],
});

const competitionRoundTemplate = (): ISessionTemplate => ({
  title: 'Competition Round',
  sessionType: 'competition_round',
  defaultDurationMinutes: 60,
  description: 'Round with rules and judging',
  defaultFields: [
    { key: 'title',       label: 'Round Title',     fieldType: 'text',     required: true,  section: 'basics', order: 0 },
    { key: 'description', label: 'Rules / Details', fieldType: 'textarea', required: false, section: 'basics', order: 1 },
    { key: 'room',        label: 'Venue / Room',    fieldType: 'text',     required: false, section: 'venue',  order: 2 },
  ],
});

// ─── Default event templates ──────────────────────────────────────────────────

const SEED_TEMPLATES = [
  // 1. Conference
  {
    name: 'Tech Conference',
    description: 'Multi-track sessions, keynotes, speakers, and an expo hall. Perfect for large professional gatherings.',
    eventType: 'conference',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#2563EB',
    tags: ['conference', 'professional', 'multi-track'],
    defaultVisibility: 'public',
    allowsSubEvents: true,
    maxSubEventDepth: 2,
    defaultPolicies: { refundPolicy: 'partial', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      capacityField(30),
      ...policyFields(40),
      { key: 'organizerName', label: 'Organizer Name', fieldType: 'text', required: false, section: 'basics', order: 6, maxLength: 150 } as IFieldSpec,
      { key: 'pocEmail',      label: 'Point of Contact Email', fieldType: 'email', required: false, section: 'basics', order: 7 } as IFieldSpec,
    ],
    sessionTemplates: [keynoteSessionTemplate(), panelSessionTemplate(), workshopSessionTemplate(), networkingSessionTemplate()],
  },

  // 2. Workshop
  {
    name: 'Hands-on Workshop',
    description: 'Small group, hands-on learning sessions with materials and exercises. Ideal for training events.',
    eventType: 'workshop',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#059669',
    tags: ['workshop', 'training', 'hands-on'],
    defaultVisibility: 'public',
    allowsSubEvents: false,
    maxSubEventDepth: 1,
    defaultPolicies: { refundPolicy: 'full', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      capacityField(30),
      ...policyFields(40),
      { key: 'prerequisites', label: 'Prerequisites', fieldType: 'textarea', required: false, placeholder: 'What attendees should know/bring', section: 'custom', order: 50, maxLength: 1000 } as IFieldSpec,
    ],
    sessionTemplates: [workshopSessionTemplate(), networkingSessionTemplate()],
  },

  // 3. Webinar
  {
    name: 'Online Webinar',
    description: 'Virtual event for remote audiences. Includes streaming setup, Q&A, and recording options.',
    eventType: 'webinar',
    format: 'virtual',
    isFree: true,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#7C3AED',
    tags: ['webinar', 'virtual', 'online'],
    defaultVisibility: 'public',
    allowsSubEvents: false,
    maxSubEventDepth: 1,
    defaultPolicies: { refundPolicy: 'full', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      onlineLinkField(20),
      capacityField(30),
      ...policyFields(40),
      { key: 'streamPlatform', label: 'Streaming Platform', fieldType: 'select', required: false, section: 'custom', order: 50, options: ['Zoom','Google Meet','YouTube Live','Microsoft Teams','Custom'] } as IFieldSpec,
    ],
    sessionTemplates: [keynoteSessionTemplate(), panelSessionTemplate()],
  },

  // 4. Hackathon
  {
    name: 'Hackathon',
    description: 'Team-based coding competition with rounds, judging criteria, and leaderboards.',
    eventType: 'hackathon',
    format: 'hybrid',
    isFree: true,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#DC2626',
    tags: ['hackathon', 'competition', 'coding'],
    defaultVisibility: 'public',
    allowsSubEvents: true,
    maxSubEventDepth: 2,
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 16 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      onlineLinkField(26),
      capacityField(30),
      ...policyFields(40),
      { key: 'teamSizeMin', label: 'Min Team Size',   fieldType: 'number', required: false, defaultValue: '1', min: 1, max: 20, section: 'custom', order: 50 } as IFieldSpec,
      { key: 'teamSizeMax', label: 'Max Team Size',   fieldType: 'number', required: false, defaultValue: '4', min: 1, max: 20, section: 'custom', order: 51 } as IFieldSpec,
      { key: 'prizePool',   label: 'Prize Pool (₹)', fieldType: 'number', required: false, min: 0, section: 'custom', order: 52 } as IFieldSpec,
      { key: 'theme',       label: 'Hackathon Theme',fieldType: 'text',   required: false, maxLength: 200, section: 'custom', order: 53 } as IFieldSpec,
    ],
    sessionTemplates: [
      { title: 'Opening Ceremony', sessionType: 'keynote', defaultDurationMinutes: 30, description: 'Welcome and problem statement reveal', defaultFields: [] },
      { title: 'Hacking Period',   sessionType: 'other',   defaultDurationMinutes: 480, description: 'Main coding phase',                   defaultFields: [] },
      { title: 'Judging Round',    sessionType: 'competition_round', defaultDurationMinutes: 120, description: 'Project presentations & judging', defaultFields: [] },
      { title: 'Award Ceremony',   sessionType: 'keynote', defaultDurationMinutes: 30,  description: 'Winners announced & prizes distributed', defaultFields: [] },
    ],
  },

  // 5. Concert / Performance
  {
    name: 'Concert / Performance',
    description: 'Live performance event with stage setup, artist lineup, and audience ticketing tiers.',
    eventType: 'concert',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#D97706',
    tags: ['concert', 'performance', 'music'],
    defaultVisibility: 'public',
    allowsSubEvents: false,
    maxSubEventDepth: 1,
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      capacityField(30),
      ...policyFields(40),
      { key: 'artists',    label: 'Artists / Performers', fieldType: 'textarea', required: false, placeholder: 'List of performers', section: 'custom', order: 50, maxLength: 500 } as IFieldSpec,
      { key: 'ageRating',  label: 'Age Rating',           fieldType: 'select',   required: false, section: 'custom', order: 51, options: ['All ages','13+','16+','18+'] } as IFieldSpec,
    ],
    sessionTemplates: [
      { title: 'Opening Act',      sessionType: 'performance', defaultDurationMinutes: 30, description: 'Support act before main performance', defaultFields: [] },
      { title: 'Main Performance', sessionType: 'performance', defaultDurationMinutes: 90, description: 'Headline artist set', defaultFields: [] },
      { title: 'Intermission',     sessionType: 'break',       defaultDurationMinutes: 20, description: 'Break between sets', defaultFields: [] },
    ],
  },

  // 6. Corporate Summit
  {
    name: 'Corporate Summit',
    description: 'Internal or external corporate summit with leadership talks, breakouts, and networking dinners.',
    eventType: 'summit',
    format: 'hybrid',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#0F172A',
    tags: ['summit', 'corporate', 'leadership'],
    defaultVisibility: 'restricted',
    allowsSubEvents: true,
    maxSubEventDepth: 2,
    defaultPolicies: { refundPolicy: 'partial', attendeeMinAge: 18 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      onlineLinkField(26),
      capacityField(30),
      ...policyFields(40),
      { key: 'companyName',   label: 'Hosting Company', fieldType: 'text',   required: false, maxLength: 200, section: 'basics', order: 7 } as IFieldSpec,
      { key: 'dressCode',     label: 'Dress Code',      fieldType: 'select', required: false, section: 'custom', order: 50, options: ['Business Formal','Business Casual','Smart Casual','Casual'] } as IFieldSpec,
      { key: 'cateringNotes', label: 'Catering / Dietary Notes', fieldType: 'textarea', required: false, maxLength: 500, section: 'custom', order: 51 } as IFieldSpec,
    ],
    sessionTemplates: [keynoteSessionTemplate(), panelSessionTemplate(), workshopSessionTemplate(), networkingSessionTemplate()],
  },

  // 7. Exhibition
  {
    name: 'Art / Product Exhibition',
    description: 'An exhibition with booths, gallery sections, and visiting hours. Great for showcases and expos.',
    eventType: 'exhibition',
    format: 'physical',
    isFree: true,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#9333EA',
    tags: ['exhibition', 'expo', 'showcase'],
    defaultVisibility: 'public',
    allowsSubEvents: true,
    maxSubEventDepth: 2,
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      capacityField(30),
      ...policyFields(40),
      { key: 'boothInfo', label: 'Booth / Stall Info', fieldType: 'textarea', required: false, placeholder: 'Booth timings, vendor rules, etc.', section: 'custom', order: 50, maxLength: 1500 } as IFieldSpec,
      { key: 'entryRules', label: 'Entry Rules', fieldType: 'textarea', required: false, section: 'custom', order: 51, maxLength: 1500 } as IFieldSpec,
    ],
    sessionTemplates: [
      { title: 'Opening Ceremony', sessionType: 'keynote', defaultDurationMinutes: 30, description: 'Welcome note', defaultFields: [] },
      breakSessionTemplate(),
      networkingSessionTemplate(),
    ],
  },

  // 8. Festival
  {
    name: 'Festival',
    description: 'Multi-hour or multi-day festival with performances, stalls, and on-ground logistics.',
    eventType: 'festival',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#16A34A',
    tags: ['festival', 'music', 'community'],
    defaultVisibility: 'public',
    allowsSubEvents: true,
    maxSubEventDepth: 2,
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      capacityField(30),
      ...policyFields(40),
      { key: 'lineup', label: 'Lineup / Program', fieldType: 'textarea', required: false, placeholder: 'Artists, segments, timings', section: 'custom', order: 50, maxLength: 2000 } as IFieldSpec,
      { key: 'parkingInfo', label: 'Parking / Transport Info', fieldType: 'textarea', required: false, section: 'custom', order: 51, maxLength: 1000 } as IFieldSpec,
    ],
    sessionTemplates: [
      { title: 'Gates Open', sessionType: 'other', defaultDurationMinutes: 30, description: 'Entry opens', defaultFields: [] },
      { title: 'Main Performance Block', sessionType: 'performance', defaultDurationMinutes: 120, description: 'Primary performances', defaultFields: [] },
      breakSessionTemplate(),
      networkingSessionTemplate(),
    ],
  },

  // 9. Competition
  {
    name: 'Competition',
    description: 'A structured competition with rounds, rules, and an award ceremony.',
    eventType: 'competition',
    format: 'hybrid',
    isFree: true,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#EF4444',
    tags: ['competition', 'rounds', 'awards'],
    defaultVisibility: 'public',
    allowsSubEvents: false,
    maxSubEventDepth: 1,
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 0 },
    fields: [
      ...coreBasicsFields(0),
      ...coreDateFields(10),
      ...coreVenueFields(20),
      onlineLinkField(26),
      capacityField(30),
      ...policyFields(40),
      { key: 'rules', label: 'Rules', fieldType: 'textarea', required: true, placeholder: 'Competition rules and scoring', section: 'custom', order: 50, maxLength: 3000 } as IFieldSpec,
      { key: 'prizes', label: 'Prizes', fieldType: 'textarea', required: false, placeholder: 'Prizes and awards', section: 'custom', order: 51, maxLength: 1500 } as IFieldSpec,
    ],
    sessionTemplates: [
      competitionRoundTemplate(),
      breakSessionTemplate(),
      { title: 'Award Ceremony', sessionType: 'keynote', defaultDurationMinutes: 30, description: 'Winners announced', defaultFields: [] },
    ],
  },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────

export const seedDefaultTemplates = async (): Promise<void> => {
  const existingCount = await EventTemplate.countDocuments({ isDefault: true });
  if (existingCount > 0) {
    console.log(`[seed] ${existingCount} default templates already exist — skipping seed.`);
    return;
  }

  await EventTemplate.insertMany(SEED_TEMPLATES);
  console.log(`[seed] Inserted ${SEED_TEMPLATES.length} default event templates.`);
};
