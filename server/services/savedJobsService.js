import { ObjectId } from "mongodb";

const COLLECTION = "savedJobs";

function isAdminSavedUserId(applicantId) {
    return applicantId === "admin";
}

export default function savedJobsService(db) {
    const collection = db.collection(COLLECTION);
    const jobsCol = db.collection("jobs");
    const applicantsCol = db.collection("applicants");
    const adminsCol = db.collection("admins");

    collection
        .createIndex({ applicantId: 1, jobId: 1 }, { unique: true })
        .catch(() => {});

    /** Applicants, literal `admin`, or a logged-in admin document id (Mongo string). */
    async function ensureActorForSavedJobs(applicantId) {
        if (isAdminSavedUserId(applicantId)) return;

        if (!ObjectId.isValid(applicantId)) {
            const err = new Error("Invalid applicant id");
            err.statusCode = 400;
            throw err;
        }

        const oid = new ObjectId(applicantId);
        const applicant = await applicantsCol.findOne({ _id: oid });
        if (applicant) return;

        const admin = await adminsCol.findOne({ _id: oid });
        if (admin) return;

        const err = new Error("Applicant not found");
        err.statusCode = 404;
        throw err;
    }

    return {
        async save({ applicantId, jobId }) {
            if (!ObjectId.isValid(jobId)) {
                const err = new Error("Invalid job id");
                err.statusCode = 400;
                throw err;
            }

            await ensureActorForSavedJobs(applicantId);

            const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
            if (!job) {
                const err = new Error("Job not found");
                err.statusCode = 404;
                throw err;
            }

            const savedAt = new Date().toISOString();
            try {
                await collection.insertOne({
                    applicantId,
                    jobId,
                    savedAt,
                });
            } catch (e) {
                if (e?.code === 11000) {
                    return await collection.findOne({ applicantId, jobId });
                }
                throw e;
            }

            return await collection.findOne({ applicantId, jobId });
        },

        async listJobsForUser(applicantId) {
            if (!isAdminSavedUserId(applicantId) && !ObjectId.isValid(applicantId)) return [];

            await ensureActorForSavedJobs(applicantId);

            const saved = await collection
                .find({ applicantId })
                .sort({ savedAt: -1 })
                .toArray();

            const orderedIds = saved.map((s) => s.jobId).filter((id) => ObjectId.isValid(id));
            if (orderedIds.length === 0) return [];

            const jobs = await jobsCol
                .find({
                    _id: { $in: orderedIds.map((id) => new ObjectId(id)) },
                })
                .toArray();

            const rank = new Map(orderedIds.map((id, i) => [String(id), i]));
            jobs.sort((a, b) => (rank.get(String(a._id)) ?? 0) - (rank.get(String(b._id)) ?? 0));

            return jobs;
        },

        async listJobIdsForUser(applicantId) {
            if (!isAdminSavedUserId(applicantId) && !ObjectId.isValid(applicantId)) return [];
            const rows = await collection.find({ applicantId }).project({ jobId: 1, _id: 0 }).toArray();
            return rows.map((r) => r.jobId).filter(Boolean);
        },

        async remove({ applicantId, jobId }) {
            if (!ObjectId.isValid(jobId)) {
                const err = new Error("Invalid job id");
                err.statusCode = 400;
                throw err;
            }
            if (!isAdminSavedUserId(applicantId) && !ObjectId.isValid(applicantId)) {
                const err = new Error("Invalid applicant id");
                err.statusCode = 400;
                throw err;
            }

            const result = await collection.deleteOne({ applicantId, jobId });
            return { deleted: result.deletedCount > 0 };
        },
    };
}
