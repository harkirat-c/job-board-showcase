import { useState, useEffect, useMemo, useCallback } from "react";
import ApplicantJobCard from "./ApplicantJobCard";
import { getCurrentUser, getUserRole, hasApplicantPortalAccess, isMongoObjectIdString } from "../../utils/user";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function JobListings() {
    const [jobs, setJobs] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
    const [employerMap, setEmployerMap] = useState({});
    const [avgRatingMap, setAvgRatingMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [savedJobIds, setSavedJobIds] = useState(() => new Set());
    const [saveBusyJobId, setSaveBusyJobId] = useState(null);
    const currentUser = getCurrentUser();
    const applicantId = currentUser?.id;
    const canUseSavedStars = hasApplicantPortalAccess(currentUser);
    const canLoadRecommendations =
        getUserRole(currentUser) === "applicant" && applicantId && isMongoObjectIdString(applicantId);

    const refreshSavedJobIds = useCallback(async () => {
        if (!canUseSavedStars || !applicantId) {
            setSavedJobIds(new Set());
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/saved/ids/${applicantId}`);
            if (!res.ok) return;
            const ids = await res.json();
            setSavedJobIds(new Set((Array.isArray(ids) ? ids : []).map(String)));
        } catch {
            // ignore
        }
    }, [canUseSavedStars, applicantId]);

    const handleToggleSave = useCallback(
        async (job, nextSaved) => {
            const jobId = String(job._id);
            if (!canUseSavedStars || !applicantId || !jobId) return;

            setSaveBusyJobId(jobId);
            let snapshot = null;
            setSavedJobIds((prev) => {
                snapshot = new Set(prev);
                const next = new Set(prev);
                if (nextSaved) next.add(jobId);
                else next.delete(jobId);
                return next;
            });

            try {
                if (nextSaved) {
                    const res = await fetch(`${API_BASE}/saved`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ applicantId, jobId }),
                    });
                    if (!res.ok) throw new Error("save failed");
                } else {
                    const res = await fetch(`${API_BASE}/saved/${applicantId}/${jobId}`, {
                        method: "DELETE",
                    });
                    if (!res.ok && res.status !== 404) throw new Error("unsave failed");
                }
            } catch {
                if (snapshot) setSavedJobIds(snapshot);
            } finally {
                setSaveBusyJobId(null);
            }
        },
        [canUseSavedStars, applicantId]
    );

    const loadJobs = useCallback(async () => {
        try {
            setLoading(true);

            const requests = [
                fetch(`${API_BASE}/jobs`),
                fetch(`${API_BASE}/employers`),
            ];

            if (canLoadRecommendations) {
                requests.push(fetch(`${API_BASE}/jobs/recommendations/${applicantId}`));
            }

            const [jobsRes, employersRes, recommendationsRes] = await Promise.all(requests);

            if (!jobsRes.ok || !employersRes.ok) throw new Error("Failed to load data");

            const [jobsData, employersData] = await Promise.all([
                jobsRes.json(),
                employersRes.json(),
            ]);

            const openJobs = jobsData.filter((j) => !j.isClosed);
            setJobs(openJobs);

            const map = {};
            for (const emp of employersData) {
                map[emp._id] = emp.companyName || emp.name || "Unknown Employer";
            }
            setEmployerMap(map);

            const employerIds = [...new Set(openJobs.map((j) => j.employerId).filter(Boolean))];
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

            if (recommendationsRes?.ok) {
                const recommendationsData = await recommendationsRes.json();
                setRecommendedJobs(recommendationsData || []);
            } else {
                setRecommendedJobs([]);
            }
            setRecommendationsLoaded(true);
            setError(null);
            await refreshSavedJobIds();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [applicantId, canLoadRecommendations, refreshSavedJobIds]);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    useEffect(() => {
        const events = new EventSource(`${API_BASE}/events`);

        const onJobChanged = async () => {
            await loadJobs();
        };

        events.addEventListener('job-created', onJobChanged);
        events.addEventListener('job-updated', onJobChanged);
        events.addEventListener('job-deleted', onJobChanged);

        return () => {
            events.removeEventListener('job-created', onJobChanged);
            events.removeEventListener('job-updated', onJobChanged);
            events.removeEventListener('job-deleted', onJobChanged);
            events.close();
        };
    }, [loadJobs]);

    const filteredJobs = useMemo(() => {
        const q = search.toLowerCase();
        const loc = location.toLowerCase();

        return jobs
            .filter((job) => {
                const matchesSearch =
                    !q ||
                    job.title?.toLowerCase().includes(q) ||
                    job.description?.toLowerCase().includes(q) ||
                    (job.skills ?? []).some((s) => s.toLowerCase().includes(q));
                const matchesLocation =
                    !loc || job.location?.toLowerCase().includes(loc);
                return matchesSearch && matchesLocation;
            })
            .sort((a, b) => {
                const dateA = new Date(a.postedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.postedAt || b.createdAt || 0).getTime();
                return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
            });
    }, [jobs, search, location, sortOrder]);

    const filteredRecommendedJobs = useMemo(() => {
        const q = search.toLowerCase();
        const loc = location.toLowerCase();

        return recommendedJobs.filter((job) => {
            const matchesSearch =
                !q ||
                job.title?.toLowerCase().includes(q) ||
                job.description?.toLowerCase().includes(q) ||
                (job.skills ?? []).some((s) => s.toLowerCase().includes(q));
            const matchesLocation =
                !loc || job.location?.toLowerCase().includes(loc);
            return matchesSearch && matchesLocation;
        });
    }, [recommendedJobs, search, location]);

    const recommendedJobIds = useMemo(
        () => new Set(filteredRecommendedJobs.map((job) => String(job._id))),
        [filteredRecommendedJobs]
    );

    const otherJobs = useMemo(
        () => filteredJobs.filter((job) => !recommendedJobIds.has(String(job._id))),
        [filteredJobs, recommendedJobIds]
    );

    if (loading) {
        return <p className="mt-12 text-center text-slate-500">Loading jobs…</p>;
    }

    if (error) {
        return <p className="mt-12 text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="mb-6 text-3xl font-bold text-slate-900">Get Employed</h1>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search by title, description, or skill…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-48 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
                />
                <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-48 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
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

            {canLoadRecommendations && recommendationsLoaded && (
                <section className="mb-8">
                    <div className="mb-4 border-b border-slate-200 pb-2">
                        <h2 className="text-lg font-semibold text-slate-900">Recommended Jobs</h2>
                        <p className="text-xs text-slate-500">Based on your skills and profile preferences</p>
                    </div>
                    {filteredRecommendedJobs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredRecommendedJobs.map((job) => (
                                <ApplicantJobCard
                                    key={`recommended-${job._id}`}
                                    job={job}
                                    employerName={employerMap[job.employerId]}
                                    avgRating={avgRatingMap[job.employerId]}
                                    matchScore={job.matchScore}
                                    matchReasons={job.matchReasons}
                                    isSaved={savedJobIds.has(String(job._id))}
                                    onToggleSave={handleToggleSave}
                                    saveBusy={saveBusyJobId === String(job._id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Add skills and preferences in your profile to get personalized recommendations.
                        </p>
                    )}
                </section>
            )}

            <section>
                <div className="mb-4 border-b border-slate-200 pb-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {canLoadRecommendations ? "Other Jobs" : "All Jobs"}
                    </h2>
                </div>
                {otherJobs.length === 0 ? (
                    <p className="mt-6 text-center text-slate-400">No jobs match your search.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {otherJobs.map((job) => (
                            <ApplicantJobCard
                                key={job._id}
                                job={job}
                                employerName={employerMap[job.employerId]}
                                avgRating={avgRatingMap[job.employerId]}
                                isSaved={savedJobIds.has(String(job._id))}
                                onToggleSave={handleToggleSave}
                                saveBusy={saveBusyJobId === String(job._id)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default JobListings;