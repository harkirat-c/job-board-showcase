import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import bcrypt from 'bcryptjs'
import Skills from './Skills'
import { formatPhoneNumber } from '../utils/phone'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function RegisterForm() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('Applicant')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    skills: [],
    profilePicture: '',
    resume: '',
    name: '',
    location: '',
    industry: '',
    logo: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(value) }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhoneBlur = () => {
    setFormData((prev) => ({
      ...prev,
      phone: formatPhoneNumber(prev.phone),
    }))
  }

  const handleSkillsChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      skills: Array.isArray(e.target.value) ? e.target.value : [],
    }))
  }

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    try {
      const form = new FormData()
      form.append('image', file)

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        body: form,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Image upload failed')
      }

      setFormData((prev) => ({ ...prev, [field]: data.url }))
    } catch (error) {
      setUploadError(error.message || 'Image upload failed')
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    try {
      const form = new FormData()
      form.append('resume', file)

      const response = await fetch(`${API_BASE}/upload/resume`, {
        method: 'POST',
        body: form,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Resume upload failed')
      }

      setFormData((prev) => ({ ...prev, resume: data.url }))
    } catch (error) {
      setUploadError(error.message || 'Resume upload failed')
    }
  }

  const handleAccountTypeChange = (type) => {
    setAccountType(type)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address')
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone number is required')
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (accountType === 'Applicant') {
        if (!formData.firstName.trim()) {
          throw new Error('First name is required')
        }
        if (!formData.lastName.trim()) {
          throw new Error('Last name is required')
        }
      } else {
        if (!formData.name.trim()) {
          throw new Error('Company name is required')
        }
        if (!formData.location.trim()) {
          throw new Error('Location is required')
        }
        if (!formData.industry.trim()) {
          throw new Error('Industry is required')
        }
      }

      const endpoint = accountType === 'Applicant' ? `${API_BASE}/applicants` : `${API_BASE}/employers`
      
      const hashedPassword = await bcrypt.hash(formData.password, 10)
      
      let payload
      if (accountType === 'Applicant') {
        payload = {
          name: {
            first: formData.firstName,
            last: formData.lastName,
          },
          email: formData.email,
          password: hashedPassword,
          phone: formData.phone,
          skills: formData.skills,
          profilePicture: formData.profilePicture,
          resume: formData.resume,
        }
      } else {
        payload = {
          name: formData.name,
          companyName: formData.name,
          email: formData.email,
          location: formData.location,
          industry: formData.industry,
          password: hashedPassword,
          phone: formData.phone,
          logo: formData.logo,
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const rawBody = await response.text()
      let payload_response = null

      if (rawBody) {
        try {
          payload_response = JSON.parse(rawBody)
        } catch {
          throw new Error('Server error: Invalid response format')
        }
      }

      if (response.status === 400) {
        throw new Error(payload_response?.message || 'Invalid input. Please check all fields are filled correctly.')
      }
      if (response.status === 409) {
        throw new Error('Email already exists. Please use a different email or sign in.')
      }
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      }
      if (!response.ok) {
        throw new Error(payload_response?.message || `Registration failed (Error ${response.status})`)
      }

      localStorage.setItem('user', JSON.stringify({ ...payload_response, role: accountType.toLowerCase() }))
      navigate(accountType === 'Applicant' ? '/jobs' : '/jobs/employers')
    } catch (error) {
      if (error instanceof TypeError) {
        setErrorMessage('Network error. Please check your connection and try again.')
      } else {
        setErrorMessage(error.message || 'An error occurred during registration')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-white p-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-12 w-full text-center">
        <div className="flex justify-center mb-8">
          <svg className="w-16 h-16 text-purple-200 stroke-purple-300" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>

        <h1 className="mb-10 text-3xl font-bold text-slate-900">Create an Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3 mt-6 mb-2">
            <button
              type="button"
              onClick={() => handleAccountTypeChange('Applicant')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                accountType === 'Applicant'
                  ? 'bg-gray-800 text-white border-2 border-gray-800'
                  : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-purple-500 hover:text-purple-500'
              }`}
            >
              Applicant
            </button>
            <button
              type="button"
              onClick={() => handleAccountTypeChange('Employer')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                accountType === 'Employer'
                  ? 'bg-gray-800 text-white border-2 border-gray-800'
                  : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-purple-500 hover:text-purple-500'
              }`}
            >
              Employer
            </button>
          </div>

          {accountType === 'Applicant' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <div className="text-left">
                <label className="mb-1 block text-sm font-medium text-gray-700">Profile Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleImageUpload(e, 'profilePicture')}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                />
                {formData.profilePicture && (
                  <img
                    src={`${API_BASE}${formData.profilePicture}`}
                    alt="Profile preview"
                    className="mt-3 h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                )}
              </div>
              <Skills
                skills={formData.skills}
                onChange={handleSkillsChange}
                className="border-gray-300 bg-white"
              />
              <div className="text-left">
                <label className="mb-1 block text-sm font-medium text-gray-700">Resume (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                />
                {formData.resume && (
                  <p className="mt-2 text-sm font-medium text-green-600">Resume uploaded ✓</p>
                )}
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                name="name"
                placeholder="Company Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <input
                type="text"
                name="industry"
                placeholder="Industry"
                value={formData.industry}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <div className="text-left">
                <label className="mb-1 block text-sm font-medium text-gray-700">Company Logo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                />
                {formData.logo && (
                  <img
                    src={`${API_BASE}${formData.logo}`}
                    alt="Logo preview"
                    className="mt-3 h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                )}
              </div>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            onBlur={handlePhoneBlur}
            inputMode="tel"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
          />

          {errorMessage && (
            <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {uploadError && (
            <div className="bg-amber-100 text-amber-700 px-4 py-3 rounded-lg text-sm">
              {uploadError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-linear-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-4"
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-purple-500 font-semibold hover:text-purple-700 hover:underline cursor-pointer transition-colors">
            Sign in here
          </a>
        </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
