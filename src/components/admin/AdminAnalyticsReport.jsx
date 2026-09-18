import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser, getUserRole } from '../../utils/user'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function toDateInputValue(date) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function getPresetRange(preset) {
  const now = new Date()
  const end = new Date(now)

  if (preset === 'last7') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    return { start, end }
  }

  if (preset === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end }
  }

  const start = new Date(now)
  start.setDate(now.getDate() - 29)
  return { start, end }
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-violet-700">{value}</p>
    </article>
  )
}

function Timeline({ title, points = [] }) {
  const max = Math.max(1, ...points.map((p) => p.count || 0))

  return (
    <section className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-900">{title}</h3>
      {points.length === 0 ? (
        <p className="text-sm text-slate-500">No data in selected range.</p>
      ) : (
        <div className="space-y-2">
          {points.map((point) => (
            <div key={point.period} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm">
              <span className="text-slate-600">{point.period}</span>
              <div className="h-2 overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full rounded bg-violet-600"
                  style={{ width: `${Math.round(((point.count || 0) / max) * 100)}%` }}
                />
              </div>
              <span className="text-right font-semibold text-slate-800">{point.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AdminAnalyticsReport() {
  const [datePreset, setDatePreset] = useState('last30')
  const [groupBy, setGroupBy] = useState('day')

  const initialCustomRange = useMemo(() => getPresetRange('last30'), [])
  const [customStartDate, setCustomStartDate] = useState(toDateInputValue(initialCustomRange.start))
  const [customEndDate, setCustomEndDate] = useState(toDateInputValue(initialCustomRange.end))

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (getUserRole(user) !== 'admin') {
      setError('Admin access required')
      return
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError('')

        const range = datePreset === 'custom'
          ? { start: new Date(customStartDate), end: new Date(customEndDate) }
          : getPresetRange(datePreset)

        if (Number.isNaN(range.start.getTime()) || Number.isNaN(range.end.getTime())) {
          throw new Error('Please provide a valid date range')
        }

        if (range.start.getTime() > range.end.getTime()) {
          throw new Error('Start date must be before end date')
        }

        const params = new URLSearchParams({
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
          groupBy,
        })

        const res = await fetch(`${API_BASE}/admin/analytics?${params.toString()}`, {
          headers: {
            'x-user-role': 'admin',
          },
        })

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error || 'Failed to load analytics')
        }

        const payload = await res.json()
        setReport(payload)
      } catch (err) {
        setError(err.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [datePreset, customStartDate, customEndDate, groupBy])

  const summary = report?.summary || {
    totalSignUps: 0,
    applicantSignUps: 0,
    employerSignUps: 0,
    reviews: 0,
    applications: 0,
    jobsPosted: 0,
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Site Analytics Report</h2>
        <p className="mt-1 text-sm text-slate-500">Admin-only usage summary with date filtering.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Range
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="thisMonth">This month</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Group by
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
        </div>

        {datePreset === 'custom' && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Start date
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              End date
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
          </div>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-violet-100 bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading analytics...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total new sign ups" value={summary.totalSignUps} />
            <StatCard label="Applicant sign ups" value={summary.applicantSignUps} />
            <StatCard label="Employer sign ups" value={summary.employerSignUps} />
            <StatCard label="New reviews/comments" value={summary.reviews} />
            <StatCard label="New applications" value={summary.applications} />
            <StatCard label="New jobs posted" value={summary.jobsPosted} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Timeline title="Sign ups timeline" points={report?.timeline?.signUps || []} />
            <Timeline title="Reviews timeline" points={report?.timeline?.reviews || []} />
          </div>
        </>
      )}
    </section>
  )
}

export default AdminAnalyticsReport
