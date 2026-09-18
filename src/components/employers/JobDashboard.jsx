import JobCard from './JobCard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/user';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

function JobDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('postedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const user = getCurrentUser();
  const employerId = user?.id;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      if (!employerId) {
        throw new Error('Missing employer id');
      }

      const [jobsRes, weeklyRes] = await Promise.all([
        fetch(`${API_BASE}/jobs/employer/${employerId}`),
        fetch(`${API_BASE}/jobs/employer/${employerId}/applications/weekly`),
      ]);
      if (!jobsRes.ok) throw new Error('Failed to fetch jobs');
      const data = await jobsRes.json();
      setJobs(Array.isArray(data) ? data : []);
      if (weeklyRes.ok) {
        const weekly = await weeklyRes.json();
        setWeeklyData(Array.isArray(weekly) ? weekly : []);
      }
      setError('');
    } catch {
      setError('Could not load jobs');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, employerId]);

  const sortedJobs = useMemo(() => {
    const normalizedOrder = sortOrder === 'asc' ? 1 : -1;

    const getPostedTime = (job) => {
      const value = job?.postedAt || job?.createdAt || job?.date;
      const timestamp = new Date(value).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const getLocation = (job) => (job?.location || '').toString().toLowerCase();

    const getPayRange = (job) => {
      const low = Number(job?.payRange?.low);
      const high = Number(job?.payRange?.high);

      if (!Number.isNaN(high)) return high;
      if (!Number.isNaN(low)) return low;
      return 0;
    };

    return [...jobs].sort((a, b) => {
      if (sortBy === 'location') {
        return getLocation(a).localeCompare(getLocation(b)) * normalizedOrder;
      }

      if (sortBy === 'payRange') {
        return (getPayRange(a) - getPayRange(b)) * normalizedOrder;
      }

      return (getPostedTime(a) - getPostedTime(b)) * normalizedOrder;
    });
  }, [jobs, sortBy, sortOrder]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!employerId) return;

    const events = new EventSource(`${API_BASE}/events`);

    const onApplicationChanged = async () => {
      await fetchJobs();
    };

    events.addEventListener('application-created', onApplicationChanged);
    events.addEventListener('application-updated', onApplicationChanged);
    events.addEventListener('application-deleted', onApplicationChanged);

    const onJobChanged = async (event) => {
      try {
        const payload = JSON.parse(event.data || '{}');
        if (normalizeId(payload?.employerId) !== normalizeId(employerId)) return;
        await fetchJobs();
      } catch {
        await fetchJobs();
      }
    };

    events.addEventListener('job-created', onJobChanged);
    events.addEventListener('job-updated', onJobChanged);
    events.addEventListener('job-deleted', onJobChanged);

    return () => {
      events.removeEventListener('application-created', onApplicationChanged);
      events.removeEventListener('application-updated', onApplicationChanged);
      events.removeEventListener('application-deleted', onApplicationChanged);
      events.removeEventListener('job-created', onJobChanged);
      events.removeEventListener('job-updated', onJobChanged);
      events.removeEventListener('job-deleted', onJobChanged);
      events.close();
    };
  }, [API_BASE, employerId, fetchJobs]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 text-slate-900">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Employer Dashboard</h1>

      {jobs.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Applications & Views per Job</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={jobs.map(j => ({ name: j.title, applications: j.totalApplications || 0, views: j.views || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#7c3aed" name="Applications" />
                <Bar dataKey="views" fill="#c4b5fd" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Applications Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" name="Applications" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/jobs/new')}
          className="cursor-pointer rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          Create Job
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="job-sort-by" className="text-sm font-medium text-slate-700">Sort by</label>
          <select
            id="job-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="postedAt">Posted date</option>
            <option value="location">Location</option>
            <option value="payRange">Pay range</option>
          </select>

          <label htmlFor="job-sort-order" className="text-sm font-medium text-slate-700">Order</label>
          <select
            id="job-sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="grid w-full mx-auto grid-cols-[repeat(auto-fit,minmax(max(300px,calc((100%-3rem)/3)),1fr))] items-stretch gap-6 py-3">
        {loading && <p className="text-slate-600">Loading jobs...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && sortedJobs.map((job) => (
          <div key={job._id || job.id} className="h-full">
            <JobCard
              job={job}
              onDelete={(deletedJobId) => {
                setJobs((prevJobs) => prevJobs.filter((j) => j._id !== deletedJobId));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobDashboard;