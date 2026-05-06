/**
 * Seed script — populates default event templates with attendance management settings.
 * Run with: npx ts-node --esm src/scripts/seedTemplates.ts
 * or via:   npm run seed:templates
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EventTemplate } from '../models/EventTemplate.js';

dotenv.config();

const DEV_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const TEMPLATES = [
  // ── Conference ─────────────────────────────────────────────────────────────
  {
    name: 'Conference',
    description: 'Perfect for multi-day professional conferences with talks, panels, and networking.',
    eventType: 'conference',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#3B82F6',
    tags: ['conference', 'professional', 'networking'],
    defaultVisibility: 'public',
    defaultStatus: 'draft',
    defaultPolicies: { refundPolicy: 'partial', attendeeMinAge: 18 },
    defaultCurrency: 'INR',
    defaultEntrySettings: {
      enableAttendanceManagement: true,
      scannerType: 'qr',
      allowMultipleScans: false,
      requireSpecificTime: false,
    },
    fields: [
      { key: 'title',            label: 'Conference Name',      fieldType: 'text',     required: true,  section: 'basics',   form: 'Basic Info',    order: 0, maxLength: 150 },
      { key: 'shortDescription', label: 'Tagline',              fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 1, maxLength: 300 },
      { key: 'description',      label: 'About this Conference',fieldType: 'textarea', required: true,  section: 'basics',   form: 'Basic Info',    order: 2, maxLength: 10000 },
      { key: 'coverImage',       label: 'Cover Image',          fieldType: 'file_image', required: false, section: 'media',  form: 'Basic Info',    order: 3 },
      { key: 'eventType',        label: 'Event Type',           fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 4, defaultValue: 'conference' },
      { key: 'format',           label: 'Format',               fieldType: 'select',   required: true,  section: 'basics',   form: 'Basic Info',    order: 5, options: ['physical', 'virtual', 'hybrid'], defaultValue: 'physical' },
      { key: 'startDate',        label: 'Start Date',           fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 0 },
      { key: 'startTime',        label: 'Start Time',           fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 1 },
      { key: 'endDate',          label: 'End Date',             fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 2 },
      { key: 'endTime',          label: 'End Time',             fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 3 },
      { key: 'timezone',         label: 'Timezone',             fieldType: 'select',   required: true,  section: 'datetime', form: 'Schedule',      order: 4 },
      { key: 'venue_name',       label: 'Venue Name',           fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 0 },
      { key: 'venue_address',    label: 'Address',              fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 1 },
      { key: 'venue_city',       label: 'City',                 fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 2 },
      { key: 'venue_state',      label: 'State / Province',     fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 3 },
      { key: 'venue_country',    label: 'Country',              fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 4 },
      { key: 'maxCapacity',      label: 'Max Capacity',         fieldType: 'number',   required: false, section: 'capacity', form: 'Capacity',      order: 0, min: 1 },
      { key: 'organizerName',    label: 'Organizer Name',       fieldType: 'text',     required: false, section: 'basics',   form: 'Organizer',     order: 0 },
      { key: 'refundPolicy',     label: 'Refund Policy',        fieldType: 'select',   required: false, section: 'policies', form: 'Policies',      order: 0, options: ['full', 'partial', 'no_refund'] },
      { key: 'cancellationPolicy',label:'Cancellation Policy',  fieldType: 'textarea', required: false, section: 'policies', form: 'Policies',      order: 1, maxLength: 2000 },
    ],
    requiresRegistration: true,
    defaultRegistrationFields: [
      { key: 'attendeeName',   label: 'Full Name',       fieldType: 'text',   required: true,  category: 'Contact Info',  categoryOrder: 0, order: 0 },
      { key: 'attendeeEmail',  label: 'Email Address',   fieldType: 'email',  required: true,  category: 'Contact Info',  categoryOrder: 0, order: 1 },
      { key: 'attendeePhone',  label: 'Phone Number',    fieldType: 'phone',  required: false, category: 'Contact Info',  categoryOrder: 0, order: 2 },
      { key: 'organization',   label: 'Company / Org',   fieldType: 'text',   required: false, category: 'Details',       categoryOrder: 1, order: 3 },
      { key: 'jobTitle',       label: 'Job Title',       fieldType: 'text',   required: false, category: 'Details',       categoryOrder: 1, order: 4 },
      { key: 'ticketTier',     label: 'Ticket Type',     fieldType: 'select', required: true,  category: 'Ticket & QR',   categoryOrder: 2, order: 5, options: ['General', 'VIP', 'Speaker'] },
      { key: 'dietaryNeeds',   label: 'Dietary Needs',   fieldType: 'select', required: false, category: 'Other',         categoryOrder: 3, order: 6, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher'] },
    ],
  },

  // ── Hackathon ──────────────────────────────────────────────────────────────
  {
    name: 'Hackathon',
    description: 'For competitive coding events with team registration, sessions, and prizes.',
    eventType: 'hackathon',
    format: 'hybrid',
    isFree: true,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#10B981',
    tags: ['hackathon', 'competition', 'students', 'teams'],
    defaultVisibility: 'public',
    defaultStatus: 'draft',
    defaultPolicies: { attendeeMinAge: 16 },
    defaultCurrency: 'USD',
    defaultEntrySettings: {
      enableAttendanceManagement: true,
      scannerType: 'qr',
      allowMultipleScans: false,
      requireSpecificTime: true,
    },
    fields: [
      { key: 'title',            label: 'Hackathon Name',       fieldType: 'text',     required: true,  section: 'basics',   form: 'Basic Info',    order: 0 },
      { key: 'shortDescription', label: 'Theme / Tagline',      fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 1, maxLength: 300 },
      { key: 'description',      label: 'About this Hackathon', fieldType: 'textarea', required: true,  section: 'basics',   form: 'Basic Info',    order: 2 },
      { key: 'coverImage',       label: 'Cover Image',          fieldType: 'file_image', required: false, section: 'media',  form: 'Basic Info',    order: 3 },
      { key: 'eventType',        label: 'Event Type',           fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 4, defaultValue: 'hackathon' },
      { key: 'format',           label: 'Format',               fieldType: 'select',   required: true,  section: 'basics',   form: 'Basic Info',    order: 5, options: ['physical', 'virtual', 'hybrid'], defaultValue: 'hybrid' },
      { key: 'startDate',        label: 'Hack Start Date',      fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 0 },
      { key: 'startTime',        label: 'Hack Start Time',      fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 1 },
      { key: 'endDate',          label: 'Hack End Date',        fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 2 },
      { key: 'endTime',          label: 'Hack End Time',        fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 3 },
      { key: 'timezone',         label: 'Timezone',             fieldType: 'select',   required: true,  section: 'datetime', form: 'Schedule',      order: 4 },
      { key: 'venue_name',       label: 'Venue / Platform',     fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 0 },
      { key: 'venue_city',       label: 'City',                 fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 1 },
      { key: 'venue_country',    label: 'Country',              fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 2 },
      { key: 'onlineLink',       label: 'Online Platform Link', fieldType: 'url',      required: false, section: 'venue',    form: 'Venue',         order: 3 },
      { key: 'maxCapacity',      label: 'Max Participants',     fieldType: 'number',   required: false, section: 'capacity', form: 'Capacity',      order: 0, min: 1 },
    ],
    requiresRegistration: true,
    defaultRegistrationFields: [
      { key: 'attendeeName',   label: 'Full Name',          fieldType: 'text',   required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 },
      { key: 'attendeeEmail',  label: 'Email Address',      fieldType: 'email',  required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 },
      { key: 'teamName',       label: 'Team Name',          fieldType: 'text',   required: false, category: 'Team',         categoryOrder: 1, order: 2 },
      { key: 'teamSize',       label: 'Team Size',          fieldType: 'text',   required: false, category: 'Team',         categoryOrder: 1, order: 3 },
      { key: 'ticketTier',     label: 'Participation Type', fieldType: 'select', required: true,  category: 'Ticket & QR',  categoryOrder: 2, order: 4, options: ['Individual', 'Team'] },
    ],
  },

  // ── Concert / Live Event ───────────────────────────────────────────────────
  {
    name: 'Concert / Live Event',
    description: 'For music concerts, performances, and live entertainment with ticketing tiers.',
    eventType: 'concert',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#8B5CF6',
    tags: ['concert', 'music', 'entertainment', 'live'],
    defaultVisibility: 'public',
    defaultStatus: 'draft',
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 0 },
    defaultCurrency: 'USD',
    defaultTicketingTiers: [
      { name: 'GA',  price: 50,  capacity: 500, description: 'General Admission' },
      { name: 'VIP', price: 150, capacity: 50,  description: 'VIP area with priority entry' },
    ],
    defaultEntrySettings: {
      enableAttendanceManagement: true,
      scannerType: 'qr',              // concerts typically use QR scanners at gate
      allowMultipleScans: false,
      requireSpecificTime: true,      // strict gate opens/closes
    },
    fields: [
      { key: 'title',            label: 'Show / Concert Name',  fieldType: 'text',     required: true,  section: 'basics',   form: 'Basic Info',    order: 0 },
      { key: 'shortDescription', label: 'Short Promo Text',     fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 1, maxLength: 300 },
      { key: 'description',      label: 'Event Details',        fieldType: 'textarea', required: true,  section: 'basics',   form: 'Basic Info',    order: 2 },
      { key: 'coverImage',       label: 'Concert Poster',       fieldType: 'file_image', required: false, section: 'media',  form: 'Basic Info',    order: 3 },
      { key: 'eventType',        label: 'Event Type',           fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 4, defaultValue: 'concert' },
      { key: 'format',           label: 'Format',               fieldType: 'select',   required: true,  section: 'basics',   form: 'Basic Info',    order: 5, options: ['physical', 'virtual', 'hybrid'], defaultValue: 'physical' },
      { key: 'startDate',        label: 'Show Date',            fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 0 },
      { key: 'startTime',        label: 'Doors Open / Show Time',fieldType: 'time',   required: true,  section: 'datetime', form: 'Schedule',      order: 1 },
      { key: 'endDate',          label: 'End Date',             fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 2 },
      { key: 'endTime',          label: 'Estimated End Time',   fieldType: 'time',     required: false, section: 'datetime', form: 'Schedule',      order: 3 },
      { key: 'timezone',         label: 'Timezone',             fieldType: 'select',   required: true,  section: 'datetime', form: 'Schedule',      order: 4 },
      { key: 'venue_name',       label: 'Venue Name',           fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 0 },
      { key: 'venue_address',    label: 'Address',              fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 1 },
      { key: 'venue_city',       label: 'City',                 fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 2 },
      { key: 'venue_country',    label: 'Country',              fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 3 },
      { key: 'maxCapacity',      label: 'Venue Capacity',       fieldType: 'number',   required: false, section: 'capacity', form: 'Capacity',      order: 0, min: 1 },
      { key: 'refundPolicy',     label: 'Refund Policy',        fieldType: 'select',   required: false, section: 'policies', form: 'Policies',      order: 0, options: ['full', 'partial', 'no_refund'] },
      { key: 'cancellationPolicy',label:'Cancellation Notice',  fieldType: 'textarea', required: false, section: 'policies', form: 'Policies',      order: 1, maxLength: 2000 },
    ],
    requiresRegistration: true,
    defaultRegistrationFields: [
      { key: 'attendeeName',   label: 'Full Name',     fieldType: 'text',   required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 },
      { key: 'attendeeEmail',  label: 'Email Address', fieldType: 'email',  required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 },
      { key: 'ticketTier',     label: 'Ticket Type',   fieldType: 'select', required: true,  category: 'Ticket & QR',  categoryOrder: 1, order: 2, options: ['GA', 'VIP', 'Early Bird'] },
    ],
  },

  // ── Workshop ───────────────────────────────────────────────────────────────
  {
    name: 'Workshop',
    description: 'For hands-on skill-building sessions with limited seats and registration forms.',
    eventType: 'workshop',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#F59E0B',
    tags: ['workshop', 'learning', 'training', 'skills'],
    defaultVisibility: 'public',
    defaultStatus: 'draft',
    defaultPolicies: { refundPolicy: 'partial', attendeeMinAge: 0 },
    defaultCurrency: 'USD',
    defaultEntrySettings: {
      enableAttendanceManagement: true,
      scannerType: 'qr',
      allowMultipleScans: false,
      requireSpecificTime: false,
    },
    fields: [
      { key: 'title',            label: 'Workshop Title',       fieldType: 'text',     required: true,  section: 'basics',   form: 'Basic Info',    order: 0 },
      { key: 'shortDescription', label: 'What You Will Learn',  fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 1, maxLength: 300 },
      { key: 'description',      label: 'Workshop Details',     fieldType: 'textarea', required: true,  section: 'basics',   form: 'Basic Info',    order: 2 },
      { key: 'coverImage',       label: 'Cover Image',          fieldType: 'file_image', required: false, section: 'media',  form: 'Basic Info',    order: 3 },
      { key: 'eventType',        label: 'Event Type',           fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 4, defaultValue: 'workshop' },
      { key: 'format',           label: 'Format',               fieldType: 'select',   required: true,  section: 'basics',   form: 'Basic Info',    order: 5, options: ['physical', 'virtual', 'hybrid'], defaultValue: 'physical' },
      { key: 'startDate',        label: 'Workshop Date',        fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 0 },
      { key: 'startTime',        label: 'Start Time',           fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 1 },
      { key: 'endDate',          label: 'End Date',             fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 2 },
      { key: 'endTime',          label: 'End Time',             fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 3 },
      { key: 'timezone',         label: 'Timezone',             fieldType: 'select',   required: true,  section: 'datetime', form: 'Schedule',      order: 4 },
      { key: 'venue_name',       label: 'Venue / Location',     fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 0 },
      { key: 'venue_address',    label: 'Address',              fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 1 },
      { key: 'venue_city',       label: 'City',                 fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 2 },
      { key: 'venue_country',    label: 'Country',              fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 3 },
      { key: 'maxCapacity',      label: 'Seats Available',      fieldType: 'number',   required: true,  section: 'capacity', form: 'Capacity',      order: 0, min: 1, max: 500 },
      { key: 'organizerName',    label: 'Instructor / Organizer',fieldType: 'text',   required: false, section: 'basics',   form: 'Organizer',     order: 0 },
    ],
    requiresRegistration: true,
    defaultRegistrationFields: [
      { key: 'attendeeName',       label: 'Full Name',           fieldType: 'text',     required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 },
      { key: 'attendeeEmail',      label: 'Email Address',       fieldType: 'email',    required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 },
      { key: 'attendeePhone',      label: 'Phone Number',        fieldType: 'phone',    required: false, category: 'Contact Info', categoryOrder: 0, order: 2 },
      { key: 'ticketTier',         label: 'Ticket Type',         fieldType: 'select',   required: true,  category: 'Ticket & QR',  categoryOrder: 1, order: 3, options: ['General', 'VIP'] },
      { key: 'specialRequirements',label: 'Special Requirements',fieldType: 'textarea', required: false, category: 'Other',        categoryOrder: 2, order: 4 },
    ],
  },

  // ── Webinar ────────────────────────────────────────────────────────────────
  {
    name: 'Webinar',
    description: 'For online seminars and virtual knowledge-sharing sessions.',
    eventType: 'webinar',
    format: 'virtual',
    isFree: true,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#06B6D4',
    tags: ['webinar', 'online', 'virtual', 'learning'],
    defaultVisibility: 'public',
    defaultStatus: 'draft',
    defaultPolicies: { attendeeMinAge: 0 },
    defaultCurrency: 'USD',
    defaultEntrySettings: {
      enableAttendanceManagement: false,     // virtual events don't need physical scanning
      scannerType: 'none',
      allowMultipleScans: false,
      requireSpecificTime: false,
    },
    fields: [
      { key: 'title',            label: 'Webinar Title',        fieldType: 'text',     required: true,  section: 'basics',   form: 'Basic Info',    order: 0 },
      { key: 'shortDescription', label: 'What You Will Learn',  fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 1, maxLength: 300 },
      { key: 'description',      label: 'Webinar Details',      fieldType: 'textarea', required: true,  section: 'basics',   form: 'Basic Info',    order: 2 },
      { key: 'coverImage',       label: 'Cover Image',          fieldType: 'file_image', required: false, section: 'media',  form: 'Basic Info',    order: 3 },
      { key: 'eventType',        label: 'Event Type',           fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 4, defaultValue: 'webinar' },
      { key: 'format',           label: 'Format',               fieldType: 'select',   required: true,  section: 'basics',   form: 'Basic Info',    order: 5, options: ['physical', 'virtual', 'hybrid'], defaultValue: 'virtual' },
      { key: 'startDate',        label: 'Webinar Date',         fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 0 },
      { key: 'startTime',        label: 'Start Time',           fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 1 },
      { key: 'endDate',          label: 'End Date',             fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 2 },
      { key: 'endTime',          label: 'End Time',             fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 3 },
      { key: 'timezone',         label: 'Timezone',             fieldType: 'select',   required: true,  section: 'datetime', form: 'Schedule',      order: 4 },
      { key: 'onlineLink',       label: 'Meeting / Stream Link',fieldType: 'url',      required: true,  section: 'venue',    form: 'Platform',      order: 0, placeholder: 'https://zoom.us/...' },
      { key: 'maxCapacity',      label: 'Max Attendees',        fieldType: 'number',   required: false, section: 'capacity', form: 'Capacity',      order: 0 },
      { key: 'organizerName',    label: 'Host / Presenter',     fieldType: 'text',     required: false, section: 'basics',   form: 'Organizer',     order: 0 },
    ],
    requiresRegistration: true,
    defaultRegistrationFields: [
      { key: 'attendeeName',  label: 'Full Name',     fieldType: 'text',  required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 },
      { key: 'attendeeEmail', label: 'Email Address', fieldType: 'email', required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 },
      { key: 'organization',  label: 'Company / Org', fieldType: 'text',  required: false, category: 'Details',      categoryOrder: 1, order: 2 },
      { key: 'ticketTier',    label: 'Session Track', fieldType: 'select',required: false, category: 'Ticket & QR',  categoryOrder: 2, order: 3, options: ['General', 'Premium'] },
    ],
  },

  // ── Exhibition ─────────────────────────────────────────────────────────────
  {
    name: 'Exhibition / Fair',
    description: 'For art shows, trade fairs, and exhibitions with timed entry management.',
    eventType: 'exhibition',
    format: 'physical',
    isFree: false,
    isDefault: true,
    isSystemTemplate: true,
    coverColor: '#EC4899',
    tags: ['exhibition', 'art', 'fair', 'culture'],
    defaultVisibility: 'public',
    defaultStatus: 'draft',
    defaultPolicies: { refundPolicy: 'no_refund', attendeeMinAge: 0 },
    defaultCurrency: 'USD',
    defaultEntrySettings: {
      enableAttendanceManagement: true,
      scannerType: 'qr',
      allowMultipleScans: true,           // exhibitions allow re-entry
      requireSpecificTime: true,
    },
    fields: [
      { key: 'title',            label: 'Exhibition Name',      fieldType: 'text',     required: true,  section: 'basics',   form: 'Basic Info',    order: 0 },
      { key: 'shortDescription', label: 'Short Description',    fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 1, maxLength: 300 },
      { key: 'description',      label: 'About the Exhibition', fieldType: 'textarea', required: true,  section: 'basics',   form: 'Basic Info',    order: 2 },
      { key: 'coverImage',       label: 'Exhibition Poster',    fieldType: 'file_image', required: false, section: 'media',  form: 'Basic Info',    order: 3 },
      { key: 'eventType',        label: 'Event Type',           fieldType: 'text',     required: false, section: 'basics',   form: 'Basic Info',    order: 4, defaultValue: 'exhibition' },
      { key: 'format',           label: 'Format',               fieldType: 'select',   required: true,  section: 'basics',   form: 'Basic Info',    order: 5, options: ['physical', 'virtual', 'hybrid'], defaultValue: 'physical' },
      { key: 'startDate',        label: 'Opening Date',         fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 0 },
      { key: 'startTime',        label: 'Opening Time',         fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 1 },
      { key: 'endDate',          label: 'Closing Date',         fieldType: 'date',     required: true,  section: 'datetime', form: 'Schedule',      order: 2 },
      { key: 'endTime',          label: 'Closing Time',         fieldType: 'time',     required: true,  section: 'datetime', form: 'Schedule',      order: 3 },
      { key: 'timezone',         label: 'Timezone',             fieldType: 'select',   required: true,  section: 'datetime', form: 'Schedule',      order: 4 },
      { key: 'venue_name',       label: 'Gallery / Venue',      fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 0 },
      { key: 'venue_address',    label: 'Address',              fieldType: 'text',     required: false, section: 'venue',    form: 'Venue',         order: 1 },
      { key: 'venue_city',       label: 'City',                 fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 2 },
      { key: 'venue_country',    label: 'Country',              fieldType: 'text',     required: true,  section: 'venue',    form: 'Venue',         order: 3 },
      { key: 'maxCapacity',      label: 'Daily Visitor Limit',  fieldType: 'number',   required: false, section: 'capacity', form: 'Capacity',      order: 0, min: 1 },
    ],
    requiresRegistration: true,
    defaultRegistrationFields: [
      { key: 'attendeeName',  label: 'Full Name',     fieldType: 'text',  required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 },
      { key: 'attendeeEmail', label: 'Email Address', fieldType: 'email', required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 },
      { key: 'ticketTier',    label: 'Entry Pass',    fieldType: 'select',required: true,  category: 'Ticket & QR',  categoryOrder: 1, order: 2, options: ['Day Pass', 'Full Access', 'VIP'] },
    ],
  },
];

async function seed() {
  const uri = process.env['MONGO_URI'];
  if (!uri) throw new Error('MONGO_URI not set in .env');

  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  let created = 0;
  let updated = 0;

  for (const tpl of TEMPLATES) {
    const existing = await EventTemplate.findOne({ name: tpl.name, isSystemTemplate: true });
    if (existing) {
      // Update existing template with new defaultEntrySettings
      await EventTemplate.findByIdAndUpdate(existing._id, {
        $set: {
          defaultEntrySettings: tpl.defaultEntrySettings,
          description:          tpl.description,
          tags:                 tpl.tags,
          fields:               tpl.fields,
          defaultPolicies:      tpl.defaultPolicies,
          defaultCurrency:      tpl.defaultCurrency,
          requiresRegistration: (tpl as any).requiresRegistration ?? false,
          defaultRegistrationFields: (tpl as any).defaultRegistrationFields ?? [],
          ...(tpl.defaultTicketingTiers ? { defaultTicketingTiers: tpl.defaultTicketingTiers } : {}),
        }
      });
      updated++;
    } else {
      await EventTemplate.create({
        ...tpl,
        createdBy: DEV_USER_ID,
      });
      created++;
    }
  }

  console.log(`✓ Templates seeded: ${created} created, ${updated} updated`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Template seed failed:', err);
  process.exit(1);
});
