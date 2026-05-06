import { Router } from 'express';
import { signup, login, checkUsername, getUserByUsername } from '../controllers/authController.js';

const router = Router();

router.post('/signup',             signup);
router.post('/login',              login);
router.get('/check-username',      checkUsername);
router.get('/user-by-username',    getUserByUsername);

export default router;
