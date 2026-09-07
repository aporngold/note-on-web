import { Router } from 'express';
import { NoteController } from '../controllers/noteController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all note routes with authentication
router.use(authenticate);

router.get('/', NoteController.getNotes);
router.post('/', NoteController.createNote);
router.get('/backup/export', NoteController.exportBackup);
router.post('/backup/restore', NoteController.restoreBackup);
router.delete('/trash/empty', NoteController.emptyTrash);
router.get('/:id', NoteController.getNoteById);
router.put('/:id', NoteController.updateNote);
router.delete('/:id', NoteController.deleteNote);
router.post('/:id/restore', NoteController.restoreNote);
router.post('/:id/duplicate', NoteController.duplicateNote);
router.post('/:id/pin', NoteController.togglePin);

export default router;
