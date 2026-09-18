import { Router } from 'express';
import adminOnly from '../middleware/adminOnly.js';
import adminAnalyticsController from '../controllers/adminAnalyticsController.js';

export default function adminRoutes(db) {
    const router = Router();
    const controller = adminAnalyticsController(db);

    router.get('/analytics', adminOnly, controller.getUsageReport);

    return router;
}
