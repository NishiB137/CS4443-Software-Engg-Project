import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import * as sessionController from '../controllers/sessionController.js';
import * as commentController from '../controllers/commentController.js';
import * as registrationController from '../controllers/registrationController.js';

const router = Router();

// ─── Event CRUD ───────────────────────────────────────────────────────────────
router.get('/', eventController.listEvents);
router.post('/', eventController.createEvent);
router.get('/timezones', eventController.getTimezones);
// NOTE: static paths MUST come before /:id — otherwise Express matches them as the :id param
router.get('/slug/:slug', eventController.getEventBySlug);
// ─── Recommendations & Admin ──────────────────────────────────────────────────
router.get('/recommendations', eventController.getRecommendations);
router.get('/pending-review', eventController.listPendingReview);

router.post('/:id/like', eventController.likeEvent);
router.post('/:id/unlike', eventController.unlikeEvent);
router.post('/:id/view', eventController.incrementView);
router.get('/:id', eventController.getEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// ─── Lifecycle ────────────────────────────────────────────────────────────────
router.patch('/:id/status', eventController.changeStatus);
router.patch('/:id/publish', eventController.publishEvent);
router.patch('/:id/archive', eventController.archiveEvent);
router.patch('/:id/approve', eventController.approveEvent);
router.patch('/:id/reject', eventController.rejectEvent);

// ─── Changelog ────────────────────────────────────────────────────────────────
router.get('/:id/changelog', eventController.getChangelog);

// ─── Sessions (nested under event) ───────────────────────────────────────────
router.post('/:eventId/sessions', sessionController.createSession);
router.get('/:eventId/sessions', sessionController.getSessionsByEvent);

// ─── Comments (nested under event) ───────────────────────────────────────────
router.post('/:eventId/comments', commentController.addComment);
router.get('/:eventId/comments', commentController.getComments);

// ─── Registrations (nested under event) ───────────────────────────────────────
router.post('/:id/register', registrationController.registerForEvent);
router.get('/:id/registrations', registrationController.listRegistrations);
router.get('/:id/registrations/check', registrationController.checkRegistration);
router.delete('/:id/registrations/:regId', registrationController.cancelRegistration);
router.post('/:id/registrations/:regId/checkout', registrationController.checkoutRegistration);
router.post('/:id/validate-qr', registrationController.validateQR);
router.post('/:id/validate-checkout-qr', registrationController.validateCheckoutQR);

// ─── Save as Template ─────────────────────────────────────────────────────────
router.post('/:id/save-as-template', eventController.saveAsTemplate);

export default router;