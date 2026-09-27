"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const passkeyController_1 = require("../controllers/passkeyController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.registerLimiter, authController_1.AuthController.register);
router.post('/login', rateLimiter_1.loginLimiter, authController_1.AuthController.login);
router.post('/logout', auth_1.authenticate, authController_1.AuthController.logout);
router.get('/me', auth_1.authenticate, authController_1.AuthController.me);
router.post('/change-password', auth_1.authenticate, authController_1.AuthController.changePassword);
// Master Password & E2EE Routes
router.post('/master-password/setup', auth_1.authenticate, authController_1.AuthController.setupMasterPassword);
router.post('/master-password/verify', auth_1.authenticate, authController_1.AuthController.verifyMasterPassword);
router.post('/master-password/recover', auth_1.authenticate, authController_1.AuthController.recoverMasterPassword);
// Google OAuth & Verification Routes
router.post('/google/verify-register', rateLimiter_1.googleAuthLimiter, authController_1.AuthController.verifyGoogleRegister);
router.get('/google', rateLimiter_1.googleAuthLimiter, authController_1.AuthController.googleAuth);
router.get('/google/callback', rateLimiter_1.googleAuthLimiter, authController_1.AuthController.googleCallback);
// Passkey (WebAuthn / Biometrics FIDO2) Routes
router.get('/passkey/register-options', auth_1.authenticate, passkeyController_1.PasskeyController.getRegisterOptions);
router.post('/passkey/register-verify', auth_1.authenticate, passkeyController_1.PasskeyController.verifyRegister);
router.post('/passkey/login-options', rateLimiter_1.loginLimiter, passkeyController_1.PasskeyController.getLoginOptions);
router.post('/passkey/login-verify', rateLimiter_1.loginLimiter, passkeyController_1.PasskeyController.verifyLogin);
router.get('/passkey/list', auth_1.authenticate, passkeyController_1.PasskeyController.listPasskeys);
router.delete('/passkey/:id', auth_1.authenticate, passkeyController_1.PasskeyController.deletePasskey);
exports.default = router;
