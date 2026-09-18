export default function savedJobsController(service) {
    return {
        async save(req, res) {
            try {
                const doc = await service.save(req.body);
                return res.status(201).json(doc);
            } catch (err) {
                const code = err.statusCode || 500;
                return res.status(code).json({ error: err.message || "Failed to save job" });
            }
        },

        async listForUser(req, res) {
            try {
                const jobs = await service.listJobsForUser(req.params.userId);
                return res.status(200).json(jobs);
            } catch (err) {
                const code = err.statusCode || 500;
                return res.status(code).json({ error: err.message || "Failed to list saved jobs" });
            }
        },

        async listIdsForUser(req, res) {
            try {
                const ids = await service.listJobIdsForUser(req.params.userId);
                return res.status(200).json(ids);
            } catch (err) {
                return res.status(500).json({ error: "Failed to list saved job ids" });
            }
        },

        async remove(req, res) {
            try {
                const { deleted } = await service.remove({
                    applicantId: req.params.userId,
                    jobId: req.params.jobId,
                });
                if (!deleted) return res.status(404).json({ error: "Saved job not found" });
                return res.status(200).json({ success: true });
            } catch (err) {
                const code = err.statusCode || 500;
                return res.status(code).json({ error: err.message || "Failed to remove saved job" });
            }
        },
    };
}
