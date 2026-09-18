import createService from './service.js';
import { ObjectId } from "mongodb";

function toTimestamp(value) {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function toSkillSet(skills) {
    return new Set((skills || []).map((skill) => normalizeText(skill)).filter(Boolean));
}

function getISOWeekLabel(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export default function jobService(db) {
    const collection = db.collection('jobs');
    const applicationsCollection = db.collection('applications');
    const applicantsCollection = db.collection('applicants');
    const service = createService(collection);

    return {
        ...service,

        async create(payload) {
            payload.isClosed = false;
            payload.applicationInboxLastViewedAt = payload.applicationInboxLastViewedAt || null;
            return await service.create(payload);
        },

        async getAll() {
            const jobs = await collection.find({}).toArray();

            return await Promise.all(
                jobs.map(async (job) => {
                    const applications = await applicationsCollection.find({ jobId: job._id?.toString?.() || job._id }).toArray();
                    const lastViewedAt = job.applicationInboxLastViewedAt || null;
                    const lastViewedTimestamp = toTimestamp(lastViewedAt);

                    const unreadApplications = applications.filter((application) => {
                        const submittedAt = application?.submittedAt || application?.date || application?.createdAt;
                        return toTimestamp(submittedAt) > lastViewedTimestamp;
                    }).length;

                    return {
                        ...job,
                        unreadApplications,
                        totalApplications: applications.length,
                        views: job.views || 0,
                    };
                })
            );
        },

        async getByEmployerId(employerId) {
            if (!ObjectId.isValid(employerId)) return [];
            const jobs = await collection.find({ employerId: employerId }).toArray();

            return await Promise.all(
                jobs.map(async (job) => {
                    const applications = await applicationsCollection.find({ jobId: job._id?.toString?.() || job._id }).toArray();
                    const lastViewedAt = job.applicationInboxLastViewedAt || null;
                    const lastViewedTimestamp = toTimestamp(lastViewedAt);

                    const unreadApplications = applications.filter((application) => {
                        const submittedAt = application?.submittedAt || application?.date || application?.createdAt;
                        return toTimestamp(submittedAt) > lastViewedTimestamp;
                    }).length;

                    return {
                        ...job,
                        unreadApplications,
                        totalApplications: applications.length,
                        views: job.views || 0,
                    };
                })
            );
        },

        async getRecommendationsForApplicant(applicantId) {
            if (!ObjectId.isValid(applicantId)) return [];

            const applicant = await applicantsCollection.findOne({ _id: new ObjectId(applicantId) });
            if (!applicant) return [];

            const applicantSkills = toSkillSet(applicant.skills || []);
            if (applicantSkills.size === 0) return [];

            const preferredLocation = normalizeText(applicant.preferences?.location || applicant.location);
            const preferredMinPay = Number(applicant.preferences?.minPay);

            const jobs = await collection.find({ isClosed: { $ne: true } }).toArray();
            const scoredJobs = jobs.map((job) => {
                const jobSkills = (job.skills || []).map((skill) => normalizeText(skill)).filter(Boolean);
                const matchedSkills = [...new Set(jobSkills.filter((skill) => applicantSkills.has(skill)))];
                const jobLocation = normalizeText(job.location);

                const skillScore = applicantSkills.size > 0
                    ? Math.min(1, matchedSkills.length / applicantSkills.size) * 70
                    : 0;

                const locationMatch = preferredLocation
                    ? (jobLocation.includes(preferredLocation) || preferredLocation.includes(jobLocation))
                    : false;
                const locationScore = locationMatch ? 20 : 0;

                let payScore = 0;
                const jobPayLow = Number(job.payRange?.low);
                const jobPayHigh = Number(job.payRange?.high);
                if (Number.isFinite(preferredMinPay) && preferredMinPay > 0) {
                    if (Number.isFinite(jobPayHigh) && jobPayHigh >= preferredMinPay) payScore = 10;
                    else if (Number.isFinite(jobPayLow) && jobPayLow >= preferredMinPay) payScore = 8;
                }

                const matchScore = Math.round(Math.min(100, skillScore + locationScore + payScore));
                const matchReasons = [];

                if (matchedSkills.length > 0) {
                    matchReasons.push(`Matched ${matchedSkills.length} skill${matchedSkills.length === 1 ? "" : "s"}`);
                }
                if (locationMatch) {
                    matchReasons.push("Matches your preferred location");
                }
                if (payScore > 0) {
                    matchReasons.push("Meets your minimum pay preference");
                }

                return {
                    ...job,
                    matchScore,
                    matchedSkills,
                    matchReasons,
                };
            });

            return scoredJobs
                .filter((job) => (job.matchedSkills || []).length > 0)
                .sort((a, b) => {
                    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
                    return toTimestamp(b.postedAt || b.createdAt) - toTimestamp(a.postedAt || a.createdAt);
                })
                .slice(0, 6);
        },

        async getApplicationsForJob(jobId) {
            const applications = await db.collection('applications')
                .find({ jobId: jobId })
                .toArray();

            return await Promise.all(
                applications.map(async (app) => {
                    try {
                        const applicantId = new ObjectId(app.applicantId);
                        const applicant = await db.collection('applicants').findOne({ _id: applicantId });
                        return {
                            ...app,
                            applicant: applicant || null
                        };
                    } catch {
                        return { ...app, applicant: null };
                    }
                })
            );
        },

        async markApplicationsAsRead(jobId) {
            const nowIso = new Date().toISOString();

            await collection.updateOne(
                { _id: new ObjectId(jobId) },
                { $set: { applicationInboxLastViewedAt: nowIso } }
            );

            return await collection.findOne({ _id: new ObjectId(jobId) });
        },

        async incrementViews(jobId) {
            await collection.updateOne(
                { _id: new ObjectId(jobId) },
                { $inc: { views: 1 } }
            );
            return await collection.findOne({ _id: new ObjectId(jobId) });
        },

        async getWeeklyApplicationsByEmployer(employerId) {
            if (!ObjectId.isValid(employerId)) return [];

            const jobs = await collection.find({ employerId }).toArray();
            const jobIds = jobs.map(j => j._id.toString());
            if (jobIds.length === 0) return [];

            const applications = await applicationsCollection
                .find({ jobId: { $in: jobIds } })
                .toArray();

            const weekMap = {};
            for (const app of applications) {
                const date = new Date(app.submittedAt || app.date || app.createdAt);
                if (isNaN(date)) continue;
                const week = getISOWeekLabel(date);
                weekMap[week] = (weekMap[week] || 0) + 1;
            }

            return Object.entries(weekMap)
                .map(([week, count]) => ({ week, count }))
                .sort((a, b) => a.week.localeCompare(b.week));
        }
    }
}