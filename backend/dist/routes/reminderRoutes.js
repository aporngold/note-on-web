"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reminderController_1 = require("../controllers/reminderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public route for VAPID key
router.get('/vapid-key', reminderController_1.ReminderController.getVapidPublicKey);
// Protected routes (Requires Auth)
router.use(auth_1.authenticate);
router.get('/', reminderController_1.ReminderController.getReminders);
router.get('/note/:noteId', reminderController_1.ReminderController.getReminderByNote);
router.post('/', reminderController_1.ReminderController.createOrUpdateReminder);
router.delete('/:id', reminderController_1.ReminderController.deleteReminder);
// Push subscription endpoints
router.post('/subscribe', reminderController_1.ReminderController.subscribePush);
router.post('/unsubscribe', reminderController_1.ReminderController.unsubscribePush);
exports.default = router;
