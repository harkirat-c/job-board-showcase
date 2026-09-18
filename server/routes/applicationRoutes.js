import { Router } from "express";
import applicationController from "../controllers/applicationController.js";
import applicationService from "../services/applicationService.js";
import validateRequest from "../middleware/validateRequest.js";
import validateParams from "../middleware/validateParams.js";
import { applicationIdParamSchema, createApplicationSchema, updateApplicationSchema } from "../validators/applicationValidator.js";

export default function applicationRoutes(db, emitEvent) {
    const service = applicationService(db);
    const controller = applicationController(service, emitEvent);
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/applicant/:applicantId", controller.getByApplicantId);
    router.get("/:id", validateParams(applicationIdParamSchema), controller.getById);
    router.post("/", validateRequest(createApplicationSchema), controller.create);
    router.patch("/:id", validateParams(applicationIdParamSchema), validateRequest(updateApplicationSchema), controller.update);
    router.delete("/:id", validateParams(applicationIdParamSchema), controller.remove);

    return router;
}