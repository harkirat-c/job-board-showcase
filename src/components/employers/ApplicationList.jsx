import { useLocation, useNavigate } from "react-router-dom";
import { ApplicationCard } from "./ApplicationCard";
import { useCallback, useEffect, useMemo, useState } from "react";

function normalizeId(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (typeof value.$oid === 'string') return value.$oid;
        if (typeof value.id === 'string') return value.id;
        if (typeof value._id === 'string') return value._id;
    }
    return String(value);
}

function ApplicantList() {
    const location = useLocation();
    const navigate = useNavigate();
    const job = location.state?.job;
    const fromAdmin = location.state?.fromAdmin;
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchName, setSearchName] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const jobId = normalizeId(job?._id);

    const fetchApplications = useCallback(async () => {
        if (!jobId) return;

        setLoading(true);
        setError('');

        try {
            await fetch(`${API_BASE}/jobs/${jobId}/applications/read`, {
                method: 'POST',
            });

            const res = await fetch(`${API_BASE}/jobs/${jobId}/applications`);
            if (!res.ok) throw new Error('Failed to fetch applications');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch applications", err);
            setError('Could not load applications');
        } finally {
            setLoading(false);
        }
    }, [API_BASE, jobId]);

    const filteredApplications = useMemo(() => {
        const q = searchName.trim().toLowerCase();

        const getApplicantName = (application) => {
            const applicant = application?.applicant || {};
            if (typeof applicant.name === 'string') return applicant.name;

            const first = applicant?.name?.first ?? applicant?.firstName ?? '';
            const last = applicant?.name?.last ?? applicant?.lastName ?? '';
            return `${first} ${last}`.trim();
        };

        const getAppliedTime = (application) => {
            const value = application?.date || application?.['date:'] || application?.appliedAt || application?.createdAt;
            const timestamp = new Date(value).getTime();
            return Number.isNaN(timestamp) ? 0 : timestamp;
        };

        return [...applications]
            .filter((application) => {
                if (!q) return true;
                return getApplicantName(application).toLowerCase().includes(q);
            })
            .sort((a, b) => {
                const diff = getAppliedTime(b) - getAppliedTime(a);
                return sortOrder === 'newest' ? diff : -diff;
            });
    }, [applications, searchName, sortOrder]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    useEffect(() => {
        if (!jobId) return;

        const events = new EventSource(`${API_BASE}/events`);

        const onApplicationChanged = async (event) => {
            try {
                const payload = JSON.parse(event.data || '{}');
                if (normalizeId(payload?.jobId) !== jobId) return;
                await fetchApplications();
            } catch (err) {
                console.error('Failed to process realtime application event:', err);
            }
        };

        events.addEventListener('application-created', onApplicationChanged);
        events.addEventListener('application-updated', onApplicationChanged);
        events.addEventListener('application-deleted', onApplicationChanged);

        return () => {
            events.removeEventListener('application-created', onApplicationChanged);
            events.removeEventListener('application-updated', onApplicationChanged);
            events.removeEventListener('application-deleted', onApplicationChanged);
            events.close();
        };
    }, [API_BASE, jobId, fetchApplications]);


    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-6">
            <button
                className="mb-6 text-sm text-violet-600 hover:underline"
                onClick={() => fromAdmin ? navigate('/admin', { state: { tab: 'Listings' } }) : navigate('/jobs/employers')}
            >
                ← Back to dashboard
            </button>

            <h1 className="mb-6 text-3xl font-bold text-slate-900">
                {job?.title ? `Applications for ${job.title}` : 'Applications'}
            </h1>

            {!loading && !error && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="Search by applicant name…"
                        className="min-w-64 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
                    />
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            )}

            {!loading && !error && applications.length > 0 && (
                <p className="mb-4 text-sm text-slate-500">
                    Showing {filteredApplications.length} of {applications.length} {applications.length === 1 ? 'application' : 'applications'}
                </p>
            )}

            {loading && <p className="text-slate-600">Loading applications...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 py-3 cursor-default">
                    {filteredApplications.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                            {applications.length === 0 ? 'No applications found for this job.' : 'No applications match your search.'}
                        </div>
                    ) : (
                        filteredApplications.map((application) => (
                            <ApplicationCard key={application._id} application={application} job={job} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}



export default ApplicantList;