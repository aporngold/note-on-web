"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shareController_1 = require("../controllers/shareController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
// Public route to view a shared note
router.get('/public/:code', shareController_1.ShareController.getPublicNote);
// Protected routes to manage share settings
router.get('/:noteId/settings', auth_1.authenticate, shareController_1.ShareController.getShareSettings);
router.post('/:noteId', auth_1.authenticate, shareController_1.ShareController.updateShareSettings);
exports.default = router;
