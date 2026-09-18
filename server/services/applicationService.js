import { ObjectId } from 'mongodb';
import createService from './service.js';

export default function applicationService(db) {
    const service = createService(db.collection('applications'));

    return {
        ...service,

        async getByApplicantId(applicantId) {
            const applications = await db.collection('applications')
                .find({ applicantId: applicantId })
                .sort({ createdAt: -1 })
                .toArray();

            return await Promise.all(
                applications.map(async (app) => {
                    try {
                        const job = await db.collection('jobs').findOne({ _id: new ObjectId(app.jobId) });
                        return {
                            ...app,
                            job: job || null,
                            jobTitle: job?.title ?? 'Deleted Job',
                        };
                    } catch {
                        return { ...app, job: null, jobTitle: 'Unknown Job' };
                    }
                })
            );
        },

        async create(payload, checkExists) {
            const nowIso = new Date().toISOString();
            const normalizedPayload = {
                ...payload,
                submittedAt: payload?.submittedAt || payload?.date || payload?.createdAt || nowIso,
                createdAt: payload?.createdAt || nowIso,
            };

            if (!ObjectId.isValid(normalizedPayload.jobId)) {
                const error = new Error('Invalid job id');
                error.statusCode = 400;
                throw error;
            }
            const job = await db.collection('jobs').findOne({ _id: new ObjectId(normalizedPayload.jobId) });
            if (!job) {
                const error = new Error('Job not found');
                error.statusCode = 404;
                throw error;
            }

            if (!ObjectId.isValid(normalizedPayload.applicantId)) {
                const error = new Error('Invalid applicant id');
                error.statusCode = 400;
                throw error;
            }
            const applicant = await db.collection('applicants').findOne({ _id: new ObjectId(normalizedPayload.applicantId) });
            if (!applicant) {
                const error = new Error('Applicant not found');
                error.statusCode = 404;
                throw error;
            }

            return await service.create(
                normalizedPayload,
                checkExists || { jobId: normalizedPayload.jobId, applicantId: normalizedPayload.applicantId }
            );
        },
    };
}