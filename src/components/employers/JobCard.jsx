import { useNavigate } from "react-router-dom";
import { Skill } from "../Skills";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

const defaultJob = {
    id: 1,
    title: 'Software Engineer',
    description: 'We are looking for a skilled software engineer to join our team. The ideal candidate will have experience with JavaScript, React, and Node.js. You will be responsible for developing and maintaining our web applications. This is a great opportunity to work on exciting projects and grow your career.',
    payRange: {
        low: 70000,
        high: 120000
    },
    location: 'Kelowna, BC',
    additionalQuestions: [
        'What is your experience with JavaScript?',
        'Have you worked with React before?',
        'Do you have experience with Node.js?'
    ],
    skills: ['JavaScript', 'React', 'Node.js']
};

function JobCard({ job = defaultJob, onDelete, onEdit, onExplore, isAdmin }) {
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const postedDate = job.postedAt || job.date || job.createdAt;
    const postedTimeAgo = formatTimeAgo(postedDate);
    const unreadApplications = Number(job?.unreadApplications || 0);
    const totalApplications = Number(job?.totalApplications || 0);
    const views = Number(job?.views || 0);


    const buttonStyle = "cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100";

    async function deleteJob() {
        if (onExplore) {
            onDelete?.(job._id);
            return;
        }

        confirm("Are you sure you want to delete this job? This action cannot be undone.") && await fetch(`${API_BASE}/jobs/${job._id}`, {
            method: "DELETE",
        }).then(res => {
            if (!res.ok) {
                console.error("Something went wrong deleting the job", res.status);
                return;
            }

            console.log("Deleted job");
            onDelete?.(job._id);
        }).catch(err => {
            console.error("Request failed", err);
        });
    }

    const titleClickParams = () => {
        if (onExplore) return onExplore(job._id);
        return navigate(`/jobs/employers/${job._id}/applications`, { state: { job } });
    };

    const editClickParams = () => {
        if (onEdit) return onEdit(job._id);
        return navigate(`/jobs/employers/${job._id}`, { state: { job } });
    };

    return (
        <div className="flex h-full w-full cursor-default flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">

            <div className="flex justify-between items-start gap-3 grow">
                <h3 
                    className="wrap-break-word min-w-0 flex-1 cursor-pointer text-2xl font-semibold hover:text-violet-700 hover:underline"
                    onClick={titleClickParams}
                    title={`View applications for ${job.title}`}
                    >
                        {job.title}
                </h3>

                <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex justify-end gap-2">
                        <button
                            className={buttonStyle}
                            onClick={editClickParams}
                        >
                            Edit
                        </button>
                        <button
                            className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                            onClick={deleteJob}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="wrap-break-word">
                <h6 className="text-base font-medium text-slate-800">${job.payRange.low} - ${job.payRange.high}, <span className="text-slate-500">{job.location}</span></h6>
                {postedTimeAgo && (
                    <p className="text-sm text-slate-500">Posted {postedTimeAgo}</p>
                )}
                
                <div className="mt-2 flex flex-wrap gap-2">
                    {!isAdmin && unreadApplications > 0 && (
                        <p className="inline-flex w-fit items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {unreadApplications} unread application{unreadApplications === 1 ? '' : 's'}
                        </p>
                    )}
                    <p className="inline-flex w-fit items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {totalApplications} application{totalApplications === 1 ? '' : 's'}
                    </p>
                    <p className="inline-flex w-fit items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {views} view{views === 1 ? '' : 's'}
                    </p>
                </div>
            </div>


            <p className="line-clamp-3 min-h-18 text-slate-600">{job.description}</p>

            <ul className="w-full mt-auto flex justify-start items-center flex-nowrap overflow-x-auto overflow-y-hidden [&>li]:shrink-0">
                {(job.skills ?? []).map((skill, i) => (
                    <Skill
                        key={i}
                        name={skill}
                    />
                ))}
            </ul>
        </div>
    )
}

export default JobCard;