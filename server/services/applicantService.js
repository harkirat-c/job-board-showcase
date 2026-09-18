import createService from './service.js';
import process from 'process';

export default function applicantService(db) {
    const baseService = createService(db.collection('applicants'));
    const applicants = db.collection('applicants');
    const employers = db.collection('employers');

    return {
        ...baseService,

        async create(payload) {
            const normalizedEmail = payload?.email?.trim()?.toLowerCase();
            if (!normalizedEmail) {
                const error = new Error('Email is required');
                error.statusCode = 400;
                throw error;
            }

            const adminEmail = process.env.ADMIN_EMAIL?.trim()?.toLowerCase();
            const [existingApplicant, existingEmployer] = await Promise.all([
                applicants.findOne({ email: normalizedEmail }),
                employers.findOne({ email: normalizedEmail }),
            ]);

            if (existingApplicant || existingEmployer || (adminEmail && adminEmail === normalizedEmail)) {
                const error = new Error('Email already exists');
                error.statusCode = 409;
                throw error;
            }

            const normalizedPayload = {
                ...payload,
                email: normalizedEmail,
                createdAt: payload?.createdAt || new Date().toISOString(),
            };
            return await baseService.create(normalizedPayload);
        }
    };
}