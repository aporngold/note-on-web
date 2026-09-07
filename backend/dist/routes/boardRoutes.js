"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const boardController_1 = require("../controllers/boardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public shared route (no auth required to view public board)
router.get('/shared/:shareCode', boardController_1.BoardController.getSharedBoard);
// Authenticated board routes
router.use(auth_1.authenticate);
router.get('/', boardController_1.BoardController.getBoards);
router.post('/', boardController_1.BoardController.createBoard);
router.put('/:id', boardController_1.BoardController.updateBoard);
router.post('/:id/share', boardController_1.BoardController.shareBoard);
router.delete('/:id', boardController_1.BoardController.deleteBoard);
exports.default = router;
