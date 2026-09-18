import { ObjectId } from "mongodb";
import createService from "./service.js";

export default function ratingService(db) {
    const collection = db.collection('ratings');
    const service = createService(collection);
    return {
        ...service,

        async getAll() {
            const ratings = await service.getAll();
            return await Promise.all(
                ratings.map(async (rating) => {
                    let applicant = null;
                    let employer = null;
                    try {
                        if (rating.applicantId && ObjectId.isValid(rating.applicantId)) {
                            applicant = await db.collection('applicants').findOne({ _id: new ObjectId(rating.applicantId) });
                        }
                        if (rating.employerId && ObjectId.isValid(rating.employerId)) {
                            employer = await db.collection('employers').findOne({ _id: new ObjectId(rating.employerId) });
                        }
                    } catch (e) {}

                    let applicantName = rating.applicantId;
                    let applicantEmail = null;
                    if (applicant) {
                        let first = '';
                        let last = '';
                        
                        if (applicant.name && typeof applicant.name === 'object') {
                            first = applicant.name.first || '';
                            last = applicant.name.last || '';
                        } else if (applicant.firstName || applicant.lastName) {
                            first = typeof applicant.firstName === 'object' ? applicant.firstName.first : applicant.firstName;
                            last = typeof applicant.lastName === 'object' ? applicant.lastName.last : applicant.lastName;
                        } else if (typeof applicant.name === 'string') {
                            first = applicant.name;
                        }
                        
                        applicantName = `${first || ''} ${last || ''}`.trim() || applicant.email;
                        applicantEmail = applicant.email || null;
                    }

                    let employerName = rating.employerId;
                    let employerEmail = null;
                    if (employer) {
                        employerName = employer.name || employer.companyName || employer.email;
                        employerEmail = employer.email || null;
                    }

                    return { ...rating, applicantName, employerName, applicantEmail, employerEmail };
                })
            );
        },

        async create(payload) {
            if (!ObjectId.isValid(payload.employerId)) {
                const error = new Error('Invalid employer id');
                error.statusCode = 400;
                throw error;
            }
            const employer = await db.collection('employers').findOne({ _id: new ObjectId(payload.employerId) });
            if (!employer) {
                const error = new Error('Employer not found');
                error.statusCode = 404;
                throw error;
            }

            if (!ObjectId.isValid(payload.applicantId)) {
                const error = new Error('Invalid applicant id');
                error.statusCode = 400;
                throw error;
            }
            const applicant = await db.collection('applicants').findOne({ _id: new ObjectId(payload.applicantId) });
            if (!applicant) {
                const error = new Error('Applicant not found');
                error.statusCode = 404;
                throw error;
            }

            const existingRating = await collection.findOne({
                employerId: payload.employerId,
                applicantId: payload.applicantId
            });
            if (existingRating) {
                const error = new Error('You have already rated this employer');
                error.statusCode = 409;
                throw error;
            }

            const nowIso = new Date().toISOString();
            const normalizedPayload = {
                ...payload,
                createdAt: payload?.createdAt || payload?.date || nowIso,
            };

            return await service.create(normalizedPayload, {
                employerId: normalizedPayload.employerId,
                applicantId: normalizedPayload.applicantId,
            });
        },

        async getByEmployerId(employerId) {
            if (!ObjectId.isValid(employerId)) return [];
            const ratings = await collection.find({ employerId: employerId }).toArray();
            
            return await Promise.all(
                ratings.map(async (rating) => {
                    try {
                        const applicant = await db.collection('applicants').findOne({ _id: new ObjectId(rating.applicantId) });
                        return {
                            ...rating,
                            applicant: applicant || null
                        };
                    } catch (e) {
                        return {
                            ...rating,
                            applicant: null
                        };
                    }
                })
            );
        },

        async getByApplicantId(applicantId) {
            if (!ObjectId.isValid(applicantId)) return [];
            const ratings = await collection.find({ applicantId: applicantId }).toArray();
            
            return await Promise.all(
                ratings.map(async (rating) => {
                    let employerName = rating.employerId;
                    try {
                        if (rating.employerId && ObjectId.isValid(rating.employerId)) {
                            const employer = await db.collection('employers').findOne({ _id: new ObjectId(rating.employerId) });
                            if (employer) {
                                employerName = employer.name || employer.companyName || employer.email;
                            }
                        }
                    } catch (e) {}

                    return { ...rating, employerName };
                })
            );
        },

        async getAvgRatingForEmployer(employerId) {
            const ratings = await this.getByEmployerId(employerId);
            if (ratings.length === 0) return null;
            const total = ratings.reduce((sum, r) => sum + r.rating, 0);
            return total / ratings.length;
        }
    }
}