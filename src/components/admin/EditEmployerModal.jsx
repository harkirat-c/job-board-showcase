import { useState, useEffect } from 'react'
import { formatPhoneNumber } from '../../utils/phone'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function EditEmployerModal({ employer, onClose, onSave }) {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [logo, setLogo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  useEffect(() => {
    if (employer) {
      setCompanyName(employer.companyName || employer.name || '')
      setEmail(employer.email || '')
      setPhone(formatPhoneNumber(employer.phone) || '')
      setLocation(employer.location || '')
      setIndustry(employer.industry || '')
      setLogo(employer.logo || '')
    }
  }, [employer])

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(null);
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch(`${API_BASE}/upload/image`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Image upload failed"); return; }
      setLogo(data.url);
    } catch(err) {
      setUploadError(err.message);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
        
    const updatedData = {
      name: companyName,
      companyName,
      email,
      phone,
      location,
      industry,
      logo
    }

    try {
      const response = await fetch(`${API_BASE}/employers/${employer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        throw new Error('Failed to update employer details')
      }

      const updatedEmployer = await response.json()
      onSave(updatedEmployer)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
  const labelClass = "mb-1 block text-sm font-medium text-slate-700"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Employer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {uploadError && <p className="text-red-500 text-sm mb-4">{uploadError}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            {logo ? (
              <img
                  src={`${API_BASE}${logo}`}
                  alt="Company Logo"
                  className="h-16 w-16 rounded-lg object-contain border border-slate-200 bg-white"
              />
            ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-xl font-bold text-gray-400">
                    {(companyName.charAt(0) || 'C').toUpperCase()}
                </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="cursor-pointer">
                  <span className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition inline-block">
                      Change Logo
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleLogoUpload} className="hidden" />
              </label>
              {logo && (
                <button
                    type="button"
                    onClick={() => setLogo('')}
                    className="text-sm text-red-600 hover:text-red-700 text-left font-medium"
                >
                    Remove Logo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input 
                className={inputClass} 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} 
                placeholder="(250) 555-0199" 
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kelowna, BC" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Industry</label>
            <input className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Technology" />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 transition"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditEmployerModal