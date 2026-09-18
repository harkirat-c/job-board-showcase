import { Skill } from "../Skills";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import { formatPhoneNumber } from "../../utils/phone";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImageUrl(url) {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`;
}

function toTelHref(value) {
    const trimmed = `${value ?? ''}`.trim();
    if (!trimmed) return '';
    const digits = trimmed.replace(/\D/g, '');
    if (trimmed.startsWith('+')) {
        return `tel:${trimmed.replace(/\s+/g, '')}`;
    }
    return `tel:${digits}`;
}

export function ApplicationCard({ application, job }) {
    const applicant = application.applicant || {};
    const appliedDate = application.date || application['date:'] || application.appliedAt || application.createdAt;

    const fullName = typeof applicant.name === 'string'
        ? applicant.name
        : `${applicant?.name?.first ?? applicant?.firstName ?? ''} ${applicant?.name?.last ?? applicant?.lastName ?? ''}`.trim();
    const displayName = fullName || 'Unknown Applicant';
    const displayInitial = displayName.trim()?.[0]?.toUpperCase() ?? '?';

    const applicantSkills = Array.isArray(application.skills)
        ? application.skills
        : (applicant.skills ?? []);
    const requiredSkillSet = new Set((job?.skills ?? []).map((skill) => skill.toLowerCase()));
    const nonMatchStyle = {
        backgroundColor: 'hsl(0, 0%, 95%)',
        borderColor: 'hsl(0, 0%, 80%)',
        color: 'hsl(0, 0%, 45%)',
        opacity: 0.95
    };

    const matchedSkills = applicantSkills.filter((skill) => requiredSkillSet.has(skill.toLowerCase()));
    const otherSkills = applicantSkills.filter((skill) => !requiredSkillSet.has(skill.toLowerCase()));
    const orderedSkills = [...matchedSkills, ...otherSkills];

    const appliedTimeAgo = formatTimeAgo(appliedDate);
    const avatarSrc = resolveImageUrl(applicant.profilePicture || applicant.profile || applicant.logo);
    const resumeSrc = resolveImageUrl(applicant.resume);
    const isUnread = Boolean(application.isUnread ?? application.unread ?? application.read === false);
    const displayPhone = formatPhoneNumber(applicant.phone);

    const handleResumeDownload = async () => {
        if (!resumeSrc) return;

        const response = await fetch(resumeSrc);
        if (!response.ok) {
            throw new Error('Resume download failed');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${displayName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'applicant'}-resume.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
    };

    return (
        <section className={`grid grid-cols-1 gap-4 rounded-2xl border p-6 text-slate-900 shadow-sm xl:grid-cols-2 ${isUnread ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-white'}`}>
            <div className="flex flex-col gap-2 min-w-0 overflow-hidden p-2">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex items-center min-w-0">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={displayName}
                                className="h-24 w-24 shrink-0 rounded-full border border-violet-200 bg-violet-50 object-cover sm:h-36 sm:w-36"
                            />
                        ) : (
                            <div
                                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-3xl font-semibold text-violet-300 sm:h-36 sm:w-36"
                                role="img"
                                aria-label={displayName}
                            >
                                {displayInitial}
                            </div>
                        )}
                        <div className="ml-4 flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-2xl sm:text-3xl font-semibold wrap-break-word">{displayName}</h3>
                                {isUnread && (
                                    <span className="inline-flex items-center rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
                                        New
                                    </span>
                                )}
                            </div>
                            {appliedTimeAgo && (
                                <p className="inline-flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                                    <span>Applied {appliedTimeAgo}</span>
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                <a href={`mailto:${applicant.email}`} className="text-violet-700 hover:underline">
                                    {applicant.email}
                                </a>
                                {applicant.phone && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <a href={toTelHref(applicant.phone)} className="text-violet-700 hover:underline">
                                            {displayPhone}
                                        </a>
                                    </>
                                )}
                            </div>
                            <p className="text-slate-600">{applicant.location}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleResumeDownload}
                        disabled={!resumeSrc}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        title={resumeSrc ? 'Download resume PDF' : 'No resume uploaded'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                            <path d="M14.25 2.25a.75.75 0 0 1 .53.22l4.75 4.75a.75.75 0 0 1 .22.53v11.5A2.75 2.75 0 0 1 17 22H7a2.75 2.75 0 0 1-2.75-2.75V4.75A2.75 2.75 0 0 1 7 2h7.25Zm-.75 1.81V8h3.94L13.5 4.06ZM8.5 13a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Zm0 3.5a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z" />
                        </svg>
                        <span>Resume.pdf</span>
                    </button>
                </div>
                <h4 className="mt-3 text-sm font-semibold text-slate-700">Matching Skills</h4>
                <ul className="flex justify-start items-start flex-wrap mt-2">
                    {orderedSkills.map((skill, i) => (
                        <Skill
                            key={i}
                            name={skill}
                            className="max-w-full break-all"
                            style={!requiredSkillSet.has(skill.toLowerCase()) ? nonMatchStyle : undefined} />
                    ))}
                </ul>
            </div>
            <div className="min-w-0 wrap-break-word rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-semibold text-xl mb-2">Additional Questions:</h4>
                {job.additionalQuestions?.map((question, i) => (
                    <p key={`question-${application._id}-${i}`}>
                        <strong>{question}</strong> 
                        <br />
                        {application.additionalAnswers?.[i] ||
                            <span className="text-slate-500">
                                Answer not provided.
                            </span>
                        }
                        <br />
                        <br />
                    </p>
                ))}
            </div>
        </section>
    );
}
