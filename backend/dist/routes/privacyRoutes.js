"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const privacyController_1 = require("../controllers/privacyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All privacy endpoints require authenticated user
router.use(auth_1.authenticate);
// 1. Consent Management
router.get('/consents', privacyController_1.PrivacyController.getConsents);
router.post('/consents', privacyController_1.PrivacyController.updateConsent);
// 2. Data Portability / Export
router.get('/export-data', privacyController_1.PrivacyController.exportUserData);
// 3. Data Subject Requests (Access, Erasure, Rectification, Restriction, Objection)
router.get('/requests', privacyController_1.PrivacyController.getUserRequests);
router.post('/requests', privacyController_1.PrivacyController.submitRequest);
// 4. Permanent Account Deletion
router.post('/delete-account', privacyController_1.PrivacyController.deleteAccount);
exports.default = router;
