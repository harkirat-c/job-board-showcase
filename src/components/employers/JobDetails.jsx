import { useLocation, useNavigate } from "react-router-dom";
import JobForm from "./JobForm";

function JobOverview() {
    const location = useLocation();
    const navigate = useNavigate();
    const job = location.state?.job;

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-4">
            <button
                className="mb-6 text-sm text-violet-600 hover:underline"
                onClick={() => navigate('/jobs/employers')}
            >
                ← Back to dashboard
            </button>

            <h1 className="mb-6 text-3xl font-bold text-slate-900">
                {job ? `Edit ${job.title}` : "Job Details"}
            </h1>

            <JobForm job={job} />
        </div>
    )
}

export default JobOverview;