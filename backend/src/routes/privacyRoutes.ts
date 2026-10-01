import { Router } from 'express';
import { PrivacyController } from '../controllers/privacyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All privacy endpoints require authenticated user
router.use(authenticate);

// 1. Consent Management
router.get('/consents', PrivacyController.getConsents);
router.post('/consents', PrivacyController.updateConsent);

// 2. Data Portability / Export
router.get('/export-data', PrivacyController.exportUserData);

// 3. Data Subject Requests (Access, Erasure, Rectification, Restriction, Objection)
router.get('/requests', PrivacyController.getUserRequests);
router.post('/requests', PrivacyController.submitRequest);

// 4. Permanent Account Deletion
router.post('/delete-account', PrivacyController.deleteAccount);

export default router;
