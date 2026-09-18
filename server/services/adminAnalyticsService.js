import { ObjectId } from 'mongodb';

function toTimestamp(value) {
    if (!value) return NaN;
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? NaN : ts;
}

function getObjectIdTimestamp(id) {
    try {
        if (id instanceof ObjectId) {
            return id.getTimestamp().getTime();
        }
        if (typeof id === 'string' && ObjectId.isValid(id)) {
            return new ObjectId(id).getTimestamp().getTime();
        }
    } catch {
        return NaN;
    }
    return NaN;
}

function extractTimestamp(doc, dateFields = []) {
    for (const field of dateFields) {
        const ts = toTimestamp(doc?.[field]);
        if (!Number.isNaN(ts)) return ts;
    }

    return getObjectIdTimestamp(doc?._id);
}

function formatBucketKey(timestamp, groupBy) {
    const date = new Date(timestamp);

    if (groupBy === 'month') {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    if (groupBy === 'week') {
        const day = date.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + diff
        ));
        return monday.toISOString().slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
}

function bucketStepMs(groupBy) {
    if (groupBy === 'month') return 0;
    if (groupBy === 'week') return 7 * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
}

function listBucketKeys(startTs, endTs, groupBy) {
    if (startTs > endTs) return [];

    const keys = [];

    if (groupBy === 'month') {
        const current = new Date(startTs);
        current.setUTCDate(1);
        current.setUTCHours(0, 0, 0, 0);

        const end = new Date(endTs);
        end.setUTCDate(1);
        end.setUTCHours(0, 0, 0, 0);

        while (current.getTime() <= end.getTime()) {
            keys.push(formatBucketKey(current.getTime(), 'month'));
            current.setUTCMonth(current.getUTCMonth() + 1);
        }

        return keys;
    }

    const step = bucketStepMs(groupBy);
    let cursor = startTs;

    while (cursor <= endTs) {
        keys.push(formatBucketKey(cursor, groupBy));
        cursor += step;
    }

    return [...new Set(keys)];
}

function aggregateTimeline(items, startTs, endTs, groupBy, dateFields) {
    const base = new Map(listBucketKeys(startTs, endTs, groupBy).map((key) => [key, 0]));

    for (const item of items) {
        const ts = extractTimestamp(item, dateFields);
        if (Number.isNaN(ts) || ts < startTs || ts > endTs) continue;

        const key = formatBucketKey(ts, groupBy);
        base.set(key, (base.get(key) || 0) + 1);
    }

    return [...base.entries()]
        .sort((a, b) => (a[0] > b[0] ? 1 : -1))
        .map(([period, count]) => ({ period, count }));
}

function filterRange(items, startTs, endTs, dateFields) {
    return items.filter((item) => {
        const ts = extractTimestamp(item, dateFields);
        return !Number.isNaN(ts) && ts >= startTs && ts <= endTs;
    });
}

export default function adminAnalyticsService(db) {
    const applicants = db.collection('applicants');
    const employers = db.collection('employers');
    const ratings = db.collection('ratings');
    const applications = db.collection('applications');
    const jobs = db.collection('jobs');

    return {
        async getUsageReport({ startDate, endDate, groupBy = 'day' } = {}) {
            const now = new Date();
            const end = endDate ? new Date(endDate) : now;
            const start = startDate ? new Date(startDate) : new Date(end.getTime() - (29 * 24 * 60 * 60 * 1000));

            const startTs = new Date(start).setHours(0, 0, 0, 0);
            const endTs = new Date(end).setHours(23, 59, 59, 999);

            const [applicantDocs, employerDocs, ratingDocs, applicationDocs, jobDocs] = await Promise.all([
                applicants.find({}).toArray(),
                employers.find({}).toArray(),
                ratings.find({}).toArray(),
                applications.find({}).toArray(),
                jobs.find({}).toArray(),
            ]);

            const newApplicants = filterRange(applicantDocs, startTs, endTs, ['createdAt', 'date']);
            const newEmployers = filterRange(employerDocs, startTs, endTs, ['createdAt', 'date']);
            const newReviews = filterRange(ratingDocs, startTs, endTs, ['createdAt', 'date']);
            const newApplications = filterRange(applicationDocs, startTs, endTs, ['submittedAt', 'createdAt', 'date']);
            const newJobPosts = filterRange(jobDocs, startTs, endTs, ['postedAt', 'createdAt', 'date']);

            const signupTimeline = aggregateTimeline(
                [...newApplicants, ...newEmployers],
                startTs,
                endTs,
                groupBy,
                ['createdAt', 'date']
            );

            const reviewsTimeline = aggregateTimeline(
                newReviews,
                startTs,
                endTs,
                groupBy,
                ['createdAt', 'date']
            );

            return {
                filters: {
                    startDate: new Date(startTs).toISOString(),
                    endDate: new Date(endTs).toISOString(),
                    groupBy,
                },
                summary: {
                    totalSignUps: newApplicants.length + newEmployers.length,
                    applicantSignUps: newApplicants.length,
                    employerSignUps: newEmployers.length,
                    reviews: newReviews.length,
                    applications: newApplications.length,
                    jobsPosted: newJobPosts.length,
                },
                timeline: {
                    signUps: signupTimeline,
                    reviews: reviewsTimeline,
                },
            };
        },
    };
}
