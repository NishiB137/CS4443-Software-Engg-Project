import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import * as sessionController from '../controllers/sessionController.js';
import * as commentController from '../controllers/commentController.js';

const router = Router();

// ─── Event CRUD ───────────────────────────────────────────────────────────────
router.get('/',                  eventController.listEvents);
router.post('/',                 eventController.createEvent);
// NOTE: /slug/:slug MUST come before /:id — otherwise Express matches "slug" as the :id param
router.get('/slug/:slug',        eventController.getEventBySlug);
router.post('/:id/like',         eventController.likeEvent);
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

// ─── Comments (nested under event) ───────────────────────────────────────────
router.post('/:eventId/comments', commentController.addComment);
router.get('/:eventId/comments',  commentController.getComments);

export default router;