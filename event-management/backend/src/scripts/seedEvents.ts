/**
 * Seed script — populates the dev database with diverse live-looking event data.
 * Run with:  npx ts-node --esm src/scripts/seedEvents.ts
 * or via:    npm run seed (if you add the script to package.json)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event } from '../models/Event.js';
import { EventTemplate } from '../models/EventTemplate.js';

dotenv.config();

const DEV_ORG_ID = new mongoose.Types.ObjectId('000000000000000000000002');
const DEV_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const BASE = new Date('2026-04-09T00:00:00Z');
const days = (n: number) => new Date(BASE.getTime() + n * 86_400_000);

const EVENTS = [
  // ── Conference ──────────────────────────────────────────────────────────────
  {
    title: 'TechSummit 2026',
    slug: 'techsummit-2026',
    shortDescription: 'The premier technology conference bringing together 2,000+ engineers and product leaders.',
    description: `
Join us for TechSummit 2026 — three days of deep-dive workshops, keynotes from industry icons, and networking with the brightest minds in technology.

Topics include AI/ML at scale, distributed systems, product-led growth, and the future of developer tooling.
    `.trim(),
    eventType: 'conference',
    format: 'physical',
    isFree: false,
    status: 'published',
    visibility: 'public',
    startDate: days(10),
    endDate: days(13),
    timezone: 'America/New_York',
    venue: { name: 'Javits Center', address: '429 11th Ave', city: 'New York', state: 'NY', country: 'USA' },
    maxCapacity: 2000,
    registrationCount: 1342,
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    tags: ['technology', 'ai', 'networking'],
    analytics: { views: 8200, likes: 310, bookmarks: 490, registrations: 1342 },
    faqs: [
      { question: 'Is there a student discount?', answer: 'Yes! Students get 50% off with a valid .edu email.' },
      { question: 'Are talks recorded?', answer: 'All keynotes are recorded and shared with registered attendees within 48 hours.' },
    ],
    ticketingTiers: [
      { name: 'Early Bird', price: 299, description: 'Limited early access pricing', capacity: 200 },
      { name: 'General', price: 499, description: 'Full conference access', capacity: 1500 },
      { name: 'VIP', price: 999, description: 'Front-row seating, speaker dinner & exclusive lounge', capacity: 100 },
    ],
    registrationOpenDate: days(-5),
    registrationCloseDate: days(9),
  },
  // ── Hackathon ────────────────────────────────────────────────────────────────
  {
    title: 'HackForGood: Climate Edition',
    slug: 'hackforgood-climate-2026',
    shortDescription: '48-hour hackathon challenging teams to build climate tech solutions.',
    description: `
Build a climate tech solution in 48 hours and win up to $10,000 in prizes. Open to students, professionals, and career changers. Mentors from Google, Microsoft, and top climate startups will be on-site.
    `.trim(),
    eventType: 'hackathon',
    format: 'hybrid',
    isFree: true,
    status: 'published',
    visibility: 'public',
    startDate: days(4),
    endDate: days(6),
    timezone: 'America/Los_Angeles',
    venue: { name: 'Google Campus', address: '1600 Amphitheatre Pkwy', city: 'Mountain View', state: 'CA', country: 'USA', onlineLink: 'https://meet.google.com/hackforgood' },
    maxCapacity: 500,
    registrationCount: 287,
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    tags: ['hackathon', 'climate', 'sustainability', 'prizes'],
    analytics: { views: 4100, likes: 223, bookmarks: 178, registrations: 287 },
    faqs: [
      { question: 'Can I participate remotely?', answer: 'Yes, hybrid participation is fully supported with a dedicated Discord and Zoom rooms.' },
    ],
    registrationOpenDate: days(-10),
    registrationCloseDate: days(3),
  },
  // ── Workshop ─────────────────────────────────────────────────────────────────
  {
    title: 'React Advanced Patterns Workshop',
    slug: 'react-advanced-patterns-2026',
    shortDescription: 'A full-day hands-on workshop on advanced React patterns, hooks, and performance.',
    description: `
Spend a full day diving deep into advanced React: custom hooks, render optimisation, compound components, state machine patterns, and real-world performance profiling.

Bring your laptop. All code is done live. Pairs perfectly with any skill level that's past beginner React.
    `.trim(),
    eventType: 'workshop',
    format: 'physical',
    isFree: false,
    status: 'published',
    visibility: 'public',
    startDate: days(2),
    endDate: days(2),
    timezone: 'Europe/London',
    venue: { name: 'Skills Matter', address: '160 Old Street', city: 'London', state: 'England', country: 'UK' },
    maxCapacity: 50,
    registrationCount: 44,
    coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    tags: ['react', 'javascript', 'frontend', 'workshop'],
    analytics: { views: 1800, likes: 92, bookmarks: 67, registrations: 44 },
    ticketingTiers: [
      { name: 'Standard', price: 149, description: 'Full-day workshop + lunch', capacity: 40 },
      { name: 'Pro + Recording', price: 219, description: 'Includes private recording + Q&A session', capacity: 10 },
    ],
    registrationOpenDate: days(-20),
    registrationCloseDate: days(1),
  },
  // ── Concert / Live Event ─────────────────────────────────────────────────────
  {
    title: 'Neon Bloom Live',
    slug: 'neon-bloom-live-2026',
    shortDescription: 'Immersive electronic music experience featuring Neon Bloom and three opening acts.',
    description: `
An unforgettable night of live electronic music in an immersive venue. Neon Bloom takes the stage at 10pm with visuals by ARTHAUS, supported by Pulse, Echo Drift, and VELVET.
    `.trim(),
    eventType: 'concert',
    format: 'physical',
    isFree: false,
    status: 'published',
    visibility: 'public',
    startDate: days(7),
    endDate: days(7),
    timezone: 'America/Chicago',
    venue: { name: 'Radius Chicago', address: '2400 W Wabash Ave', city: 'Chicago', state: 'IL', country: 'USA' },
    maxCapacity: 1500,
    registrationCount: 1201,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    tags: ['music', 'electronic', 'live'],
    analytics: { views: 12300, likes: 642, bookmarks: 812, registrations: 1201 },
    ticketingTiers: [
      { name: 'GA', price: 45, description: 'General Admission', capacity: 1200 },
      { name: 'VIP', price: 120, description: 'VIP area + bar tokens', capacity: 200 },
      { name: 'Backstage', price: 350, description: 'Meet & greet with Neon Bloom', capacity: 20 },
    ],
    registrationOpenDate: days(-30),
    registrationCloseDate: days(6),
    policies: { refundPolicy: 'Non-refundable. Transfers accepted up to 24 hours before the event.' },
  },
  // ── Webinar ──────────────────────────────────────────────────────────────────
  {
    title: 'Mastering MongoDB Atlas Search',
    slug: 'mastering-mongodb-atlas-search-2026',
    shortDescription: 'Free webinar: Learn to implement full-text, fuzzy, and vector search in your apps.',
    description: `
In this 90-minute webinar, MongoDB engineers will walk through Atlas Search setup, query syntax, fuzzy matching, faceted search, and brand-new vector search capabilities using Atlas Vector Search.
    `.trim(),
    eventType: 'webinar',
    format: 'virtual',
    isFree: true,
    status: 'published',
    visibility: 'public',
    startDate: days(1),
    endDate: days(1),
    timezone: 'UTC',
    venue: { onlineLink: 'https://webinar.mongodb.com/atlas-search-2026' },
    maxCapacity: 5000,
    registrationCount: 3120,
    coverImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1200&q=80',
    tags: ['mongodb', 'database', 'search', 'free', 'webinar'],
    analytics: { views: 9800, likes: 414, bookmarks: 532, registrations: 3120 },
    registrationOpenDate: days(-7),
    registrationCloseDate: days(0),
  },
  // ── Exhibition ───────────────────────────────────────────────────────────────
  {
    title: 'AI Art Exhibition: Minds & Machines',
    slug: 'ai-art-exhibition-minds-machines-2026',
    shortDescription: 'A curated exhibition exploring the intersection of artificial intelligence and visual art.',
    description: `
40 artists. 3 floors. 1 question: where does the machine end and the artist begin? Minds & Machines brings together AI-generated and AI-assisted art across painting, sculpture, video, and interactive installations.
    `.trim(),
    eventType: 'exhibition',
    format: 'physical',
    isFree: false,
    status: 'published',
    visibility: 'public',
    startDate: days(5),
    endDate: days(20),
    timezone: 'Europe/Paris',
    venue: { name: 'Palais de Tokyo', address: '13 Ave du Président Wilson', city: 'Paris', state: 'Île-de-France', country: 'France' },
    maxCapacity: 300,
    registrationCount: 189,
    coverImage: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80',
    tags: ['art', 'ai', 'exhibition', 'paris'],
    analytics: { views: 3200, likes: 178, bookmarks: 245, registrations: 189 },
    ticketingTiers: [
      { name: 'Standard Entry', price: 18, description: 'Daily admission', capacity: 280 },
      { name: 'Private Tour', price: 75, description: 'Guided tour with curator', capacity: 20 },
    ],
    registrationOpenDate: days(-14),
    registrationCloseDate: days(19),
  },
  // ── Draft (organizer-only) ───────────────────────────────────────────────────
  {
    title: 'Product Leaders Summit (Draft)',
    slug: 'product-leaders-summit-2026-draft',
    shortDescription: 'Internal draft — annual summit for senior PMs and product directors.',
    description: 'DRAFT: Do not publish yet. Agenda to be confirmed by April 20.',
    eventType: 'summit',
    format: 'physical',
    isFree: false,
    status: 'draft',
    visibility: 'hidden_link',
    startDate: days(60),
    endDate: days(62),
    timezone: 'America/New_York',
    venue: { name: 'Four Seasons', city: 'San Francisco', state: 'CA', country: 'USA' },
    maxCapacity: 120,
    registrationCount: 0,
    coverImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    tags: ['product', 'leadership', 'invite-only'],
    analytics: { views: 12, likes: 0, bookmarks: 0, registrations: 0 },
  },
];

async function seed() {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // Find or use a template _id to link
  const tpl = await EventTemplate.findOne({ isDefault: true }).lean();

  let created = 0;
  let skipped = 0;

  for (const ev of EVENTS) {
    const existing = await Event.findOne({ slug: ev.slug }).lean();
    if (existing) { skipped++; continue; }

    const payload: any = {
      ...ev,
      organization: DEV_ORG_ID,
      createdBy:    DEV_USER_ID,
      organizerName: 'Eventa Demo',
    };
    if (tpl && tpl._id) payload.templateId = tpl._id;

    await Event.create(payload);
    created++;
  }

  console.log(`✓ Seeded ${created} events (${skipped} already existed)`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
