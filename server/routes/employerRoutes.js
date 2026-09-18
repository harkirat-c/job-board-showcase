import express from "express";
import employerController from "../controllers/employerController.js";
import employerService from "../services/employerService.js";
import validateParams from "../middleware/validateParams.js";
import validateRequest from "../middleware/validateRequest.js";
import { createEmployerSchema, employerIdParamSchema, updateEmployerSchema } from "../validators/employerValidator.js";

export default function employerRoutes(db) {
    const service = employerService(db);
    const controller = employerController(service);
    const router = express.Router();

    router.get("/", controller.getAll);
    router.get("/:id", validateParams(employerIdParamSchema), controller.getById);
    router.post("/", validateRequest(createEmployerSchema), controller.create);
    router.patch("/:id", validateParams(employerIdParamSchema), validateRequest(updateEmployerSchema), controller.update);
    router.delete("/:id", validateParams(employerIdParamSchema), controller.remove);

    return router;
}