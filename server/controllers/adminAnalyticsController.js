import adminAnalyticsService from '../services/adminAnalyticsService.js';

const VALID_GROUP_BY = new Set(['day', 'week', 'month']);

export default function adminAnalyticsController(db) {
    const service = adminAnalyticsService(db);

    return {
        async getUsageReport(req, res) {
            try {
                const groupByRaw = String(req.query.groupBy || 'day').toLowerCase();
                if (!VALID_GROUP_BY.has(groupByRaw)) {
                    return res.status(400).json({ error: 'Invalid groupBy value' });
                }

                const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

                if (startDate && Number.isNaN(new Date(startDate).getTime())) {
                    return res.status(400).json({ error: 'Invalid startDate value' });
                }

                if (endDate && Number.isNaN(new Date(endDate).getTime())) {
                    return res.status(400).json({ error: 'Invalid endDate value' });
                }

                const report = await service.getUsageReport({
                    startDate,
                    endDate,
                    groupBy: groupByRaw,
                });

                return res.status(200).json(report);
            } catch (err) {
                return res.status(500).json({ error: err?.message || 'Failed to fetch analytics report' });
            }
        },
    };
}
