import NavBar from './components/NavBar'
import RegisterForm from './components/RegisterForm'
import Login from './components/Login'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import JobDashboard from './components/employers/JobDashboard'
import JobOverview from './components/employers/JobDetails'
import ApplicationList from './components/employers/ApplicationList'
import AdminDashboard from './components/admin/AdminDashboard'
import JobListings from './components/applicants/JobListings'
import ApplyPage from './components/applicants/ApplyPage'
import { useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProfilePage from './components/applicants/ProfilePage'
import MyApplications from './components/applicants/MyApplications'
import EmployerProfile from './components/employers/EmployerProfile'
import ApplicantActivityPage from './components/admin/ApplicantActivityPage'
import AdminProfilePage from './components/admin/AdminProfilePage'
import { Navigate } from 'react-router-dom'
import { getCurrentUser, getUserRole } from './utils/user'

function AdminRoute({ children }) {
  const user = getCurrentUser()
  if (getUserRole(user) !== 'admin') {
    return <Navigate to="/login" replace />
  }
  return children
}

function ProfileRouter() {
  const user = getCurrentUser()
  if (getUserRole(user) === 'admin') return <AdminProfilePage />
  if (getUserRole(user) === 'employer') return <EmployerProfile />
  return <ProfilePage />
}

function SignOut() {
  const navigate = useNavigate()
  useEffect(() => {
    localStorage.removeItem('user')
    navigate('/')
  }, [])
  return null
}

function App() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const hideNavbar = location.pathname === '/register' || location.pathname === '/login'

  return (
    <main className={`relative min-h-screen text-slate-900 ${isLandingPage ? '' : 'bg-white px-4 py-8'}`}>
      {!hideNavbar && isLandingPage && (
        <div className="absolute inset-x-0 top-0 z-20 px-4 py-8">
          <NavBar transparent />
        </div>
      )}

      {!hideNavbar && !isLandingPage && <NavBar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/applicants/:applicantId" element={
          <AdminRoute>
            <ApplicantActivityPage />
          </AdminRoute>
        } />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signout" element={<SignOut />} />
        <Route path="/profile" element={<ProfileRouter />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/jobs/:jobId/apply" element={<ApplyPage />} />
        <Route path="/jobs/employers" element={<JobDashboard />} />
        <Route path="/jobs/new" element={<JobOverview />} />
        <Route path="/jobs/employers/:jobId" element={<JobOverview />} />
        <Route path="/jobs/employers/:jobId/applications" element={<ApplicationList />} />
      </Routes>
    </main>
  )
}

export default App
