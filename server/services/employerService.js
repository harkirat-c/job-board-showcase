import createService from "./service.js";
import process from 'process';

export default function employerService(db) {
    const baseService = createService(db.collection('employers'));
    const collection = db.collection('employers');
    const applicants = db.collection('applicants');

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
            const [existingEmployer, existingApplicant] = await Promise.all([
                collection.findOne({ email: normalizedEmail }),
                applicants.findOne({ email: normalizedEmail }),
            ]);

            if (existingEmployer || existingApplicant || (adminEmail && adminEmail === normalizedEmail)) {
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
        },

        async update(id, payload) {
            return await baseService.update(id, payload);
        },

        async getByUsername(username) {
            return await collection.findOne({ username });
        },

        async getByEmail(email) {
            return await collection.findOne({ email });
        }
    };
}