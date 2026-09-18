import createController from "./controller.js";

export default function applicationController(service, emitEvent = () => {}) {
    const baseController = createController(service);

    return {
        ...baseController,

        async getByApplicantId(req, res) {
            try {
                const applications = await service.getByApplicantId(req.params.applicantId);
                return res.status(200).json(applications);
            } catch {
                return res.status(400).json({ error: "Invalid applicant id format" });
            }
        },

        async create(req, res) {
            try {
                const created = await service.create(req.body);
                emitEvent('application-created', {
                    applicationId: created?._id,
                    jobId: created?.jobId,
                    applicantId: created?.applicantId,
                    submittedAt: created?.submittedAt || created?.createdAt || new Date().toISOString(),
                });
                return res.status(201).json(created);
            }
            catch (err) {
                const statusCode = err.statusCode || 500;
                const message = err.message || "Failed to create item";
                return res.status(statusCode).json({ message });
            }
        },

        async update(req, res) {
            try {
                const updated = await service.update(req.params.id, req.body);
                if (!updated) return res.status(404).json({ error: "Not found" });

                emitEvent('application-updated', {
                    applicationId: updated?._id || req.params.id,
                    jobId: updated?.jobId,
                    applicantId: updated?.applicantId,
                    updatedAt: new Date().toISOString(),
                });

                return res.status(200).json(updated);
            }
            catch {
                return res.status(500).json({ error: "Failed to update item" });
            }
        },

        async remove(req, res) {
            try {
                const existing = await service.getById(req.params.id);
                const removed = await service.remove(req.params.id);
                if (!removed || removed.deletedCount === 0) return res.status(404).json({ error: "Not found" });

                emitEvent('application-deleted', {
                    applicationId: req.params.id,
                    jobId: existing?.jobId,
                    applicantId: existing?.applicantId,
                    deletedAt: new Date().toISOString(),
                });

                return res.status(200).json(removed);
            }
            catch {
                return res.status(400).json({ error: "Invalid id format" });
            }
        },
        
        async getByApplicantId(req, res) {
            try {
                const items = await service.getByApplicantId(req.params.applicantId);
                return res.status(200).json(items);
            } catch (err) {
                return res.status(500).json({ error: "Failed to fetch applications" });
            }
        }
    };
}