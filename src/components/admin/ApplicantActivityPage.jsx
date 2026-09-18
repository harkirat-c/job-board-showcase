import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function ApplicantActivityPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const applicant = location.state?.applicant

  const [applications, setApplications] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('applications')

  useEffect(() => {
    if (!applicant) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [appRes, revRes] = await Promise.all([
          fetch(`${API_BASE}/applications/applicant/${applicant._id}`),
          fetch(`${API_BASE}/ratings/applicant/${applicant._id}`)
        ])

        if (!appRes.ok || !revRes.ok) throw new Error('Failed to load applicant data')
        
        const appData = await appRes.json()
        const revData = await revRes.json()
        
        setApplications(appData)
        setReviews(revData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [applicant])

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch(`${API_BASE}/ratings/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete review');
      setReviews(reviews.filter(r => r._id !== reviewId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete review');
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'rejected': return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Rejected</span>
      case 'accepted': return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Accepted</span>
      case 'interview': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Interview</span>
      default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium capitalize">{status || 'Pending'}</span>
    }
  }

  const getApplicantName = () => {
    if (!applicant) return 'Applicant'
    if (applicant.name && typeof applicant.name === 'object' && applicant.name.first) return String(applicant.name.first)
    if (typeof applicant.name === 'string') return applicant.name
    if (typeof applicant.firstName === 'string') return applicant.firstName
    return 'Applicant'
  }

  if (!applicant) {
    return <div className="text-center py-12">No applicant selected.</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <button
          className="mb-6 text-sm text-violet-600 hover:underline"
          onClick={() => navigate('/admin', { state: { tab: 'Applicants' } })}
      >
          ← Back to dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-3xl font-bold text-slate-900">{getApplicantName()}&apos;s Activity</h2>
      </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setTab('applications')}
            className={`px-4 py-2 font-medium rounded-lg transition ${tab === 'applications' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Applications
          </button>
          <button 
            onClick={() => setTab('reviews')}
            className={`px-4 py-2 font-medium rounded-lg transition ${tab === 'reviews' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Reviews
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}

        <div className="flex w-full flex-col gap-5 py-3 cursor-default">
          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : tab === 'applications' ? (
            applications.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                No job applications found.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app._id} className="flex h-full w-full cursor-default flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">Job: {app.jobTitle || 'Job'}</h3>
                        <h4 className="font-medium text-gray-800 mt-1">Applicant: {getApplicantName()}</h4>
                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">
                          Applied On: {new Date(app.submittedAt || app.createdAt || app.date || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      {formatStatus(app.status)}
                    </div>
                    {app.skills && app.skills.length > 0 && (
                      <div className="mt-3">
                        <span className="font-semibold text-gray-700 text-sm block mb-1">Applicant Skills:</span>
                        <div className="flex flex-wrap gap-2">
                          {app.skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md font-medium border border-violet-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {app.additionalAnswers && app.additionalAnswers.length > 0 && (
                      <div className="flex flex-col gap-2 mt-3">
                        <span className="font-semibold text-gray-700 text-sm">Additional Answers:</span>
                        {app.additionalAnswers.map((answer, i) => (
                          <div key={i} className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600">
                            {answer || <span className="text-gray-400 italic">No answer provided</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {(app.resume || applicant?.resume) && (
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <a
                          href={`${API_BASE}${app.resume || applicant?.resume}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                          View Resume
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            reviews.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                No reviews left by this applicant.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="flex h-full w-full cursor-default flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg pr-12">Employer: {rev.employerName || 'Unknown Employer'}</h3>
                        <p className="text-xs text-gray-500 font-medium tracking-wide mt-1">
                          Rating: <span className="text-yellow-500 text-sm">{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</span> ({rev.rating}/5)
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteReview(rev._id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition absolute top-4 right-4"
                        title="Delete Review"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    {rev.comment && (
                      <div className="mt-2 bg-white p-3 rounded border border-gray-100 text-sm text-gray-600">
                        &quot;{rev.comment}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
    </div>
  )
}

export default ApplicantActivityPage