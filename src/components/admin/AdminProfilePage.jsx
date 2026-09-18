import { Link } from "react-router-dom";

export default function AdminProfilePage() {
    const card =
        "block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md";

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Administrator</h1>
            <p className="mb-6 text-sm text-slate-600">
                Quick links to applicant and employer areas (same pages as those users).
            </p>
            <ul className="flex flex-col gap-3">
                <li>
                    <Link to="/admin" className={card}>
                        <span className="font-semibold text-violet-700">Admin dashboard</span>
                    </Link>
                </li>
                <li>
                    <Link to="/jobs" className={card}>
                        <span className="font-semibold text-violet-700">Explore jobs</span>
                    </Link>
                </li>
                <li>
                    <Link to="/my-applications" className={card}>
                        <span className="font-semibold text-violet-700">My applications</span>
                    </Link>
                </li>
                <li>
                    <Link to="/jobs/employers" className={card}>
                        <span className="font-semibold text-violet-700">Manage jobs</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
}
