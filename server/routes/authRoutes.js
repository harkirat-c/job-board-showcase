import express from 'express';
import authController from '../controllers/authController.js';

export default function authRoutes(db) {
    const router = express.Router();
    const controller = authController(db);

    router.post('/login', controller.login);

    return router;
}
