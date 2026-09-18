import { Router } from 'express';
import jobController from '../controllers/jobController.js';
import jobService from '../services/jobService.js';
import validateRequest from '../middleware/validateRequest.js';
import validateParams from '../middleware/validateParams.js';
import { applicantIdParamSchema, createJobSchema, employerIdParamSchema, jobIdParamSchema, updateJobSchema } from '../validators/jobValidator.js';

export default function jobRoutes(db, emitEvent) {
    const service = jobService(db);
    const controller = jobController(service, emitEvent);
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/recommendations/:applicantId", validateParams(applicantIdParamSchema), controller.getRecommendationsForApplicant);
    router.get("/employer/:employerId", validateParams(employerIdParamSchema), controller.getByEmployerId);
    router.get("/employer/:employerId/applications/weekly", validateParams(employerIdParamSchema), controller.getWeeklyApplicationsByEmployer);
    router.get("/:id", validateParams(jobIdParamSchema), controller.getById);
    router.post("/", validateRequest(createJobSchema), controller.create);
    router.patch("/:id", validateParams(jobIdParamSchema), validateRequest(updateJobSchema), controller.update);
    router.delete("/:id", validateParams(jobIdParamSchema), controller.remove);
    router.get("/:id/applications", validateParams(jobIdParamSchema), controller.getApplicationsForJob);
    router.post("/:id/applications/read", validateParams(jobIdParamSchema), controller.markApplicationsAsRead);
    router.post("/:id/view", validateParams(jobIdParamSchema), controller.incrementViews);

    return router;
}