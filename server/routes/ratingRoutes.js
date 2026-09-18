import { Router } from "express";
import ratingController from "../controllers/ratingController.js";
import ratingService from "../services/ratingService.js";
import validateParams from "../middleware/validateParams.js";
import validateRequest from "../middleware/validateRequest.js";
import { createRatingSchema, employerIdParamSchema, ratingIdParamSchema, updateRatingSchema } from "../validators/ratingValidator.js";

export default function ratingRoutes(db, emitEvent) {
    const service = ratingService(db);
    const controller = ratingController(service, emitEvent);
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/employer/:employerId/avg", validateParams(employerIdParamSchema), controller.getAvgRatingForEmployer);
    router.get("/employer/:employerId", validateParams(employerIdParamSchema), controller.getByEmployerId);
    router.get("/applicant/:applicantId", controller.getByApplicantId);
    router.get("/:id", validateParams(ratingIdParamSchema), controller.getById);
    router.post("/", validateRequest(createRatingSchema), controller.create);
    router.put("/:id", validateParams(ratingIdParamSchema), validateRequest(updateRatingSchema), controller.update);
    router.delete("/:id", validateParams(ratingIdParamSchema), controller.remove);

    return router;
}