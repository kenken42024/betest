import { Router } from 'express';
import { homeIndex } from '../app/controllers/home.controller.js'; // Ensure correct import path
import fileRouter from './file.routes.js';

const router = Router();

// Home route
router.get('/', homeIndex);

// File-related routes (prefix this with `/files` or similar)
router.use('/files', fileRouter);

export default router;