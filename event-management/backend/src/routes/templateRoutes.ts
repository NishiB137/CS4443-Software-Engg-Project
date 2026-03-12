import { Router } from 'express';
import * as tc from '../controllers/templateController.js';

const router = Router();

router.get('/',               tc.listTemplates);
router.post('/',              tc.createTemplate);
router.get('/:id',            tc.getTemplate);
router.put('/:id',            tc.updateTemplate);
router.delete('/:id',         tc.deleteTemplate);
router.post('/:id/duplicate', tc.duplicateTemplate);
router.post('/:id/use',       tc.useTemplate);

export default router;
