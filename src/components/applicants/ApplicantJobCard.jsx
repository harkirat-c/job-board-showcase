import { useNavigate } from "react-router-dom";
import { Skill } from "../Skills";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import { getCurrentUser, hasApplicantPortalAccess } from "../../utils/user";

function jobIdString(job) {
    const id = job?._id;
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object" && id.$oid) return id.$oid;
    return String(id);
}

function StarRating({ rating }) {
    const rounded = Math.round(rating * 2) / 2;
    return (
        <span className="flex items-center gap-0.5 text-sm text-amber-400" title={`${rating?.toFixed(1) ?? 'No'} stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>
                    {rounded >= star ? "★" : rounded >= star - 0.5 ? "⯨" : "☆"}
                </span>
            ))}
        </span>
    );
}

function ApplicantJobCard({
    job,
    employerName,
    avgRating,
    matchScore,
    matchReasons = [],
    isSaved = false,
    onToggleSave,
    saveBusy = false,
}) {
    const navigate = useNavigate();
    const postedTimeAgo = formatTimeAgo(job.postedAt || job.date || job.createdAt);
    const user = getCurrentUser();
    const showSave = hasApplicantPortalAccess(user) && user?.id && typeof onToggleSave === "function";
    const jid = jobIdString(job);

    return (
        <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
            <div className="flex justify-between items-start gap-3">
                <h3 className="wrap-break-word min-w-0 flex-1 text-xl font-semibold">
                    {job.title}
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                    {typeof matchScore === "number" && (
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {matchScore}% match
                        </span>
                    )}
                    {showSave && (
                        <button
                            type="button"
                            disabled={saveBusy || !jid}
                            onClick={() => onToggleSave(job, !isSaved)}
                            className={`rounded-lg border p-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50 ${
                                isSaved
                                    ? "border-amber-300 bg-amber-50 text-amber-500"
                                    : "border-slate-200 bg-slate-50 text-slate-300 hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-400"
                            }`}
                            title={isSaved ? "Remove from saved jobs" : "Save job"}
                            aria-pressed={isSaved}
                            aria-label={isSaved ? "Saved job" : "Save job"}
                        >
                            <span className="text-lg leading-none" aria-hidden>
                                {isSaved ? "★" : "☆"}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-violet-700">{employerName || "Unknown Employer"}</span>
                    {avgRating != null && <StarRating rating={avgRating} />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                    ${job.payRange?.low?.toLocaleString()} – ${job.payRange?.high?.toLocaleString()} &middot; {job.location}
                </p>
                {postedTimeAgo && (
                    <p className="text-xs text-slate-400 mt-0.5">Posted {postedTimeAgo}</p>
                )}
            </div>

            <p className="line-clamp-3 text-slate-600 text-sm">{job.description}</p>

            {matchReasons.length > 0 && (
                <p className="text-xs text-slate-500">
                    {matchReasons.join(" • ")}
                </p>
            )}

            <ul className="w-full flex justify-start items-center flex-nowrap overflow-x-auto overflow-y-hidden [&>li]:shrink-0">
                {(job.skills ?? []).map((skill, i) => (
                    <Skill key={i} name={skill} />
                ))}
            </ul>

            {job.isClosed ? (
                <p className="mt-auto text-center text-sm text-slate-500">This job is closed.</p>
            ) : (
                <button
                    className="mt-auto w-full cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                    onClick={() => navigate(`/jobs/${jid}/apply`, { state: { job, employerName } })}
                >
                    Apply
                </button>
            )}
        </div>
    );
}

export default ApplicantJobCard;