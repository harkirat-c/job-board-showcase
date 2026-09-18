import { Router } from 'express';
import applicantController from '../controllers/applicantController.js';
import applicantService from '../services/applicantService.js';
import validateParams from '../middleware/validateParams.js';
import validateRequest from '../middleware/validateRequest.js';
import { applicantIdParamSchema, createApplicantSchema, updateApplicantSchema } from '../validators/applicantValidator.js';

export default function applicantRoutes(db) {
    const service = applicantService(db);
    const controller = applicantController(service);
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/:id", validateParams(applicantIdParamSchema), controller.getById);
    router.post("/", validateRequest(createApplicantSchema), controller.create);
    router.patch("/:id", validateParams(applicantIdParamSchema), validateRequest(updateApplicantSchema), controller.update);
    router.delete("/:id", validateParams(applicantIdParamSchema), controller.remove);

    return router;
}