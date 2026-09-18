import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Skills, { Skill } from "../Skills";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import StarRating from "../StarRating";
import ReviewSection from "../ratings/ReviewSection";
import { getCurrentUser, getUserRole, isAdmin, isMongoObjectIdString } from "../../utils/user";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function ApplyPage() {
    const { jobId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [job, setJob] = useState(state?.job || null);
    const [employer, setEmployer] = useState(null);
    const [loading, setLoading] = useState(!state?.job);
    const [error, setError] = useState(null);

    const [skills, setSkills] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const user = getCurrentUser();
    const isApplicant = user && getUserRole(user) === "applicant";
    const isAdminUser = user && isAdmin(user);
    const canSubmitApplication = Boolean(isApplicant && user?.id && isMongoObjectIdString(user.id));
    const hasViewed = useRef(false);

    useEffect(() => {
        if (job) return;
        fetch(`${API_BASE}/jobs/${jobId}`)
            .then((r) => { if (!r.ok) throw new Error("Job not found"); return r.json(); })
            .then(setJob)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [jobId]);

    useEffect(() => {
        if (!job?.employerId) return;

        if (!hasViewed.current) {
            hasViewed.current = true;
            fetch(`${API_BASE}/jobs/${jobId}/view`, { method: 'POST' }).catch(() => {});
        }

        Promise.all([
            fetch(`${API_BASE}/employers/${job.employerId}`).then((r) => r.ok ? r.json() : null),
            fetch(`${API_BASE}/ratings/employer/${job.employerId}/avg`).then((r) => r.ok ? r.json() : null),
        ]).then(([emp]) => {
            setEmployer(emp);

        });
    }, [job?.employerId]);

    useEffect(() => {
        if (job?.additionalQuestions) {
            setAnswers(job.additionalQuestions.map(() => ""));
        }
    }, [job]);

    useEffect(() => {
        if (!user || !user.id) return;

        let isMounted = true;

        fetch(`${API_BASE}/applicants/${user.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((applicant) => {
                if (!isMounted || !applicant) return;
                const savedSkills = Array.isArray(applicant.skills) ? applicant.skills : [];
                setSkills(savedSkills);
            })
            .catch(() => {
            });

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!user?.id) {
            navigate("/login", { replace: false, state: { from: `/jobs/${jobId}/apply` } });
            return;
        }
        if (!canSubmitApplication) {
            setError(
                isAdminUser
                    ? "Administrators cannot submit applicant applications. Use an applicant account to apply."
                    : "Please sign in as an applicant to apply."
            );
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/applications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    applicantId: user.id,
                    skills,
                    additionalAnswers: answers,
                    date: new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error("Submission failed");
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <p className="mt-12 text-center text-slate-500">Loading…</p>;
    if (error) return <p className="mt-12 text-center text-red-500">Error: {error}</p>;
    if (!job) return null;

    if (submitted) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
                <p className="mt-2 text-slate-500">Good luck with your application for <strong>{job.title}</strong>.</p>
                <button
                    className="mt-6 rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-700"
                    onClick={() => navigate("/jobs")}
                >
                    Back to Job Listings
                </button>
            </div>
        );
    }

    const employerName = state?.employerName || employer?.companyName || employer?.name || "Unknown Employer";
    const employerBio = employer?.bio || employer?.description || '';
    const postedTimeAgo = formatTimeAgo(job.postedAt || job.createdAt);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <button
                className="mb-6 text-sm text-violet-600 hover:underline"
                onClick={() => navigate("/jobs")}
            >
                ← Back to job listings
            </button>

            {!user?.id && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-900">
                        <strong>Note:</strong> You must log in to interact with a job.
                    </p>
                </div>
            )}
            {isAdminUser && (
                <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50 p-4">
                    <p className="text-sm text-violet-900">
                        <strong>Admin:</strong> You can review this job and form; submitting an application requires an
                        applicant account.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                        <p className="mt-1 text-lg font-medium text-violet-700">{employerName}</p>
                        {employerBio && <p className="mt-2 text-sm leading-6 text-slate-600">{employerBio}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span>{job.location}</span>
                            <span>&middot;</span>
                            <span>${job.payRange?.low?.toLocaleString()} – ${job.payRange?.high?.toLocaleString()}</span>
                            {postedTimeAgo && <><span>&middot;</span><span>Posted {postedTimeAgo}</span></>}
                        </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{job.description}</p>

                    {(job.skills ?? []).length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Required Skills</h2>
                            <div className="mt-3 max-h-28 overflow-y-auto pr-1">
                                <ul className="flex flex-wrap items-start gap-1.5">
                                    {job.skills.map((skill, index) => (
                                        <Skill key={`${skill}-${index}`} name={skill} />
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <h2 className="text-lg font-semibold text-slate-900">Your Application</h2>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Your Skills
                            </label>
                            <Skills
                                skills={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                className="border-slate-300 bg-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !canSubmitApplication}
                            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                            {submitting ? "Submitting…" : "Submit Application"}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-800">Additional Questions</h3>

                        {(job.additionalQuestions ?? []).length > 0 ? (
                            job.additionalQuestions.map((q, i) => (
                                <div key={i}>
                                    <label className="mb-1 block text-sm text-slate-600">{q}</label>
                                    <textarea
                                        rows={3}
                                        value={answers[i] || ""}
                                        onChange={(e) => {
                                            const next = [...answers];
                                            next[i] = e.target.value;
                                            setAnswers(next);
                                        }}
                                        placeholder="Your answer…"
                                        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">No additional questions</p>
                        )}
                    </div>
                </div>
            </div>

            {job?.employerId && (
                <div className="mt-8">
                    <ReviewSection employerId={job.employerId} />
                </div>
            )}
        </div>
    );
}

export default ApplyPage;