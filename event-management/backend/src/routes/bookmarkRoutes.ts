import { Router } from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';

const router = Router();

router.post('/check/:eventId', bookmarkController.checkBookmark);
router.post('/:eventId',       bookmarkController.toggleBookmark);
router.get('/',                bookmarkController.listBookmarks);

export default router;
