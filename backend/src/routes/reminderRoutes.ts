import { Router } from 'express';
import { ReminderController } from '../controllers/reminderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route for VAPID key
router.get('/vapid-key', ReminderController.getVapidPublicKey);

// Protected routes (Requires Auth)
router.use(authenticate);

router.get('/', ReminderController.getReminders);
router.get('/note/:noteId', ReminderController.getReminderByNote);
router.post('/', ReminderController.createOrUpdateReminder);
router.delete('/:id', ReminderController.deleteReminder);

// Push subscription endpoints
router.post('/subscribe', ReminderController.subscribePush);
router.post('/unsubscribe', ReminderController.unsubscribePush);

export default router;
