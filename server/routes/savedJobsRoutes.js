import { Router } from "express";
import savedJobsService from "../services/savedJobsService.js";
import savedJobsController from "../controllers/savedJobsController.js";
import validateRequest from "../middleware/validateRequest.js";
import validateParams from "../middleware/validateParams.js";
import {
    saveJobBodySchema,
    savedUserIdParamSchema,
    savedDeleteParamSchema,
} from "../validators/savedJobsValidator.js";

export default function savedJobsRoutes(db) {
    const service = savedJobsService(db);
    const controller = savedJobsController(service);
    const router = Router();

    router.post("/", validateRequest(saveJobBodySchema), controller.save);
    router.get("/ids/:userId", validateParams(savedUserIdParamSchema), controller.listIdsForUser);
    router.get("/:userId", validateParams(savedUserIdParamSchema), controller.listForUser);
    router.delete(
        "/:userId/:jobId",
        validateParams(savedDeleteParamSchema),
        controller.remove
    );

    return router;
}
