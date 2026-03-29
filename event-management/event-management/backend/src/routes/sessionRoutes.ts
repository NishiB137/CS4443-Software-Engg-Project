import { Router } from 'express';
import * as sessionController from '../controllers/sessionController.js';

const router = Router();

router.put('/:id',              sessionController.updateSession);
router.delete('/:id',           sessionController.deleteSession);
router.post('/:id/speakers',    sessionController.assignSpeaker);

export default router;