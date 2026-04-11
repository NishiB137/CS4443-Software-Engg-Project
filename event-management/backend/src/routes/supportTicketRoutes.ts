import { Router } from 'express';
import * as supportTicketController from '../controllers/supportTicketController.js';

const router = Router();

router.post('/', supportTicketController.createTicket);
router.get('/event/:eventId', supportTicketController.getTicketsByEvent);
router.get('/user/:email', supportTicketController.getTicketsByEmail);
router.patch('/:id/resolve', supportTicketController.resolveTicket);

export default router;
