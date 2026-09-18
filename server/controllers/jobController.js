import createController from "./controller.js";

export default function jobController(service, emitEvent = () => {}) {
    const controller = createController(service);

    return {
        ...controller,

        async create(req, res) {
            try {
                const created = await service.create(req.body);
                emitEvent('job-created', {
                    jobId: created?._id,
                    employerId: created?.employerId,
                    postedAt: created?.postedAt || created?.createdAt || new Date().toISOString(),
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

                emitEvent('job-updated', {
                    jobId: updated?._id || req.params.id,
                    employerId: updated?.employerId,
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

                emitEvent('job-deleted', {
                    jobId: req.params.id,
                    employerId: existing?.employerId,
                    deletedAt: new Date().toISOString(),
                });

                return res.status(200).json(removed);
            }
            catch {
                return res.status(400).json({ error: "Invalid id format" });
            }
        },

        async getByEmployerId(req, res) {
            try {
                const jobs = await service.getByEmployerId(req.params.employerId);
                return res.status(200).json(jobs);
            } catch {
                return res.status(400).json({ error: "Invalid employer id format" });
            }
        },

        async getRecommendationsForApplicant(req, res) {
            try {
                const jobs = await service.getRecommendationsForApplicant(req.params.applicantId);
                return res.status(200).json(jobs);
            } catch {
                return res.status(400).json({ error: "Invalid applicant id format" });
            }
        },

        async getApplicationsForJob(req, res) {
            try {
                const applications = await service.getApplicationsForJob(req.params.id);
                return res.status(200).json(applications);
            } catch {
                return res.status(400).json({ error: "Invalid job id format" });
            }
        },

        async markApplicationsAsRead(req, res) {
            try {
                const updatedJob = await service.markApplicationsAsRead(req.params.id);
                if (!updatedJob) return res.status(404).json({ error: "Job not found" });

                return res.status(200).json({
                    jobId: req.params.id,
                    applicationInboxLastViewedAt: updatedJob.applicationInboxLastViewedAt,
                });
            } catch {
                return res.status(400).json({ error: "Invalid job id format" });
            }
        },

        async incrementViews(req, res) {
            try {
                await service.incrementViews(req.params.id);
                return res.status(200).json({ success: true });
            } catch {
                return res.status(400).json({ error: "Invalid job id format" });
            }
        },

        async getWeeklyApplicationsByEmployer(req, res) {
            try {
                const data = await service.getWeeklyApplicationsByEmployer(req.params.employerId);
                return res.status(200).json(data);
            } catch {
                return res.status(400).json({ error: "Invalid employer id" });
            }
        }
    }
}