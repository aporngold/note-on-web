import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerLimiter, loginLimiter, googleAuthLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, AuthController.changePassword);

// Master Password & E2EE Routes
router.post('/master-password/setup', authenticate, AuthController.setupMasterPassword);
router.post('/master-password/verify', authenticate, AuthController.verifyMasterPassword);
router.post('/master-password/recover', authenticate, AuthController.recoverMasterPassword);

// Google OAuth & Verification Routes
router.post('/google/verify-register', googleAuthLimiter, AuthController.verifyGoogleRegister);
router.get('/google', googleAuthLimiter, AuthController.googleAuth);
router.get('/google/callback', googleAuthLimiter, AuthController.googleCallback);

export default router;
