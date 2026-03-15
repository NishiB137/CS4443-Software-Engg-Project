import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import * as sessionController from '../controllers/sessionController.js';

const router = Router();

// ─── Event CRUD ───────────────────────────────────────────────────────────────
router.get('/',                  eventController.listEvents);
router.post('/',                 eventController.createEvent);
// NOTE: /slug/:slug MUST come before /:id — otherwise Express matches "slug" as the :id param
router.get('/slug/:slug',        eventController.getEventBySlug);
router.get('/:id',               eventController.getEvent);
router.put('/:id',               eventController.updateEvent);
router.delete('/:id',            eventController.deleteEvent);

// ─── Lifecycle ────────────────────────────────────────────────────────────────
router.patch('/:id/status',      eventController.changeStatus);
router.patch('/:id/publish',     eventController.publishEvent);
router.patch('/:id/archive',     eventController.archiveEvent);

// ─── Changelog ────────────────────────────────────────────────────────────────
router.get('/:id/changelog',     eventController.getChangelog);

// ─── Sessions (nested under event) ───────────────────────────────────────────
router.post('/:eventId/sessions', sessionController.createSession);
router.get('/:eventId/sessions',  sessionController.getSessionsByEvent);

export default router;