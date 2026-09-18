import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ApplicantJobCard from "./ApplicantJobCard";
import { getCurrentUser, getUserRole, isAdmin } from "../../utils/user";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const tabBtn =
    "rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";
const tabActive = "border-slate-200 bg-white text-violet-700";
const tabInactive = "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200";

function MyApplications() {
    const navigate = useNavigate();
    const session = getCurrentUser();
    const userId = session?.id ?? "";
    const role = session ? getUserRole(session) : null;

    const [tab, setTab] = useState("applied");
    const [applications, setApplications] = useState([]);
    const [employerMap, setEmployerMap] = useState({});
    const [avgRatingMap, setAvgRatingMap] = useState({});
    const [savedJobs, setSavedJobs] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [saveBusyJobId, setSaveBusyJobId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savedError, setSavedError] = useState(null);

    useEffect(() => {
        if (!userId) {
            navigate("/login", { replace: true });
            return;
        }
        if (role !== "applicant" && role !== "admin") {
            navigate("/", { replace: true });
            return;
        }

        async function load() {
            try {
                const [appsRes, employersRes] = await Promise.all([
                    fetch(`${API_BASE}/applications/applicant/${userId}`),
                    fetch(`${API_BASE}/employers`),
                ]);

                if (!appsRes.ok) throw new Error("Failed to load applications");
                if (!employersRes.ok) throw new Error("Failed to load employers");

                const [appsData, employersData] = await Promise.all([
                    appsRes.json(),
                    employersRes.json(),
                ]);

                setApplications(Array.isArray(appsData) ? appsData : []);

                const map = {};
                for (const emp of employersData) {
                    map[emp._id] = emp.companyName || emp.name || "Unknown Company";
                }
                setEmployerMap(map);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [userId, role, navigate]);

    const loadSaved = useCallback(async () => {
        if (!userId) return;
        setSavedLoading(true);
        setSavedError(null);
        try {
            const [jobsRes, employersRes] = await Promise.all([
                fetch(`${API_BASE}/saved/${userId}`),
                fetch(`${API_BASE}/employers`),
            ]);

            if (!jobsRes.ok) throw new Error("Failed to load saved jobs");
            if (!employersRes.ok) throw new Error("Failed to load employers");

            const [jobsData, employersData] = await Promise.all([
                jobsRes.json(),
                employersRes.json(),
            ]);

            const jobs = Array.isArray(jobsData) ? jobsData : [];
            setSavedJobs(jobs);

            const map = {};
            for (const emp of employersData) {
                map[emp._id] = emp.companyName || emp.name || "Unknown Company";
            }
            setEmployerMap(map);

            const employerIds = [...new Set(jobs.map((j) => j.employerId).filter(Boolean))];
            const ratingResults = await Promise.all(
                employerIds.map((id) =>
                    fetch(`${API_BASE}/ratings/employer/${id}/avg`)
                        .then((r) => (r.ok ? r.json() : null))
                        .catch(() => null)
                )
            );
            const ratingMap = {};
            employerIds.forEach((id, i) => {
                const result = ratingResults[i];
                if (result?.avg != null) ratingMap[id] = result.avg;
            });
            setAvgRatingMap(ratingMap);
        } catch (err) {
            setSavedError(err.message);
        } finally {
            setSavedLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (tab !== "saved" || !userId) return;
        loadSaved();
    }, [tab, userId, loadSaved]);

    const savedIds = useMemo(() => new Set(savedJobs.map((j) => String(j._id))), [savedJobs]);

    const handleToggleSave = useCallback(
        async (job, nextSaved) => {
            const jobId = String(job._id);
            if (!userId || !jobId) return;

            setSaveBusyJobId(jobId);
            let listSnapshot = null;
            if (!nextSaved) {
                setSavedJobs((prev) => {
                    listSnapshot = prev.slice();
                    return prev.filter((j) => String(j._id) !== jobId);
                });
            }

            try {
                if (nextSaved) {
                    const res = await fetch(`${API_BASE}/saved`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ applicantId: userId, jobId }),
                    });
                    if (!res.ok) throw new Error("Could not save job");
                } else {
                    const res = await fetch(`${API_BASE}/saved/${userId}/${jobId}`, {
                        method: "DELETE",
                    });
                    if (!res.ok && res.status !== 404) throw new Error("Could not remove saved job");
                }
            } catch {
                if (listSnapshot) setSavedJobs(listSnapshot);
            } finally {
                setSaveBusyJobId(null);
            }
        },
        [userId]
    );

    useEffect(() => {
        const previous = document.title;
        document.title = "My Applications";
        return () => {
            document.title = previous;
        };
    }, []);

    if (!userId || (role !== "applicant" && role !== "admin")) return null;
    if (loading) return <p className="mt-12 text-center text-slate-500">Loading…</p>;
    if (error) return <p className="mt-12 text-center text-red-500">Error: {error}</p>;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">My Applications</h1>
            <p className="mb-6 text-sm text-slate-500">
                View jobs you have applied to and manage jobs you have saved.
            </p>

            {isAdmin(session) && (
                <p className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-900">
                    Signed in as <strong>admin</strong>: applied list and saved jobs use the admin workspace (separate
                    from real applicant accounts).
                </p>
            )}

            <div className="mb-6 flex gap-1 border-b border-slate-200">
                <button
                    type="button"
                    className={`${tabBtn} ${tab === "applied" ? tabActive : tabInactive}`}
                    onClick={() => setTab("applied")}
                >
                    Applied Jobs
                </button>
                <button
                    type="button"
                    className={`${tabBtn} ${tab === "saved" ? tabActive : tabInactive}`}
                    onClick={() => setTab("saved")}
                >
                    Saved Jobs
                </button>
            </div>

            {tab === "applied" && (
                <div role="tabpanel" aria-label="Applied jobs">
                    {applications.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
                            <p className="text-slate-500">You have not applied to any jobs yet.</p>
                            <button
                                type="button"
                                className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                                onClick={() => navigate("/jobs")}
                            >
                                Browse Jobs
                            </button>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-4">
                            {applications.map((app) => {
                                const job = app.job;
                                const companyName =
                                    employerMap[job?.employerId] ?? "Unknown Company";
                                const appliedDate = app.submittedAt || app.date || app.createdAt;

                                return (
                                    <li
                                        key={app._id}
                                        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h2 className="text-lg font-semibold text-slate-900">
                                                    {job?.title ?? app.jobTitle ?? "Job no longer available"}
                                                </h2>
                                                <p className="text-sm text-violet-700">{companyName}</p>
                                            </div>
                                            {appliedDate && (
                                                <p className="shrink-0 text-sm text-slate-400">
                                                    Applied {formatTimeAgo(appliedDate)}
                                                </p>
                                            )}
                                        </div>

                                        {(job || app.jobTitle) && (
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                                {job?.location && <span>{job.location}</span>}
                                                {job?.payRange && (
                                                    <span>
                                                        ${job.payRange.low?.toLocaleString()} – $
                                                        {job.payRange.high?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {tab === "saved" && (
                <div role="tabpanel" aria-label="Saved jobs">
                    {savedError && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                            {savedError}
                        </p>
                    )}
                    {savedLoading ? (
                        <p className="text-center text-slate-500">Loading saved jobs…</p>
                    ) : savedJobs.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
                            <p className="text-slate-500">You have not saved any jobs yet.</p>
                            <button
                                type="button"
                                className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                                onClick={() => navigate("/jobs")}
                            >
                                Explore Jobs
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {savedJobs.map((job) => (
                                <ApplicantJobCard
                                    key={String(job._id)}
                                    job={job}
                                    employerName={employerMap[job.employerId]}
                                    avgRating={avgRatingMap[job.employerId]}
                                    isSaved={savedIds.has(String(job._id))}
                                    onToggleSave={handleToggleSave}
                                    saveBusy={saveBusyJobId === String(job._id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MyApplications;
