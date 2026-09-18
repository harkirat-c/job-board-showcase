const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function ItemCard({ item, onDelete, onEdit, onExplore, itemType = 'applicant' }) {
  const getFirstName = () => {
    if (itemType === 'employer') {
      return item.name || 'Unknown Company'
    }
    if (itemType === 'listing') {
      return item.title || 'Untitled Job'
    }    if (itemType === 'review') {
      return `Rating: ${item.rating}/5`
    }    
    if (typeof item.name === 'string') return item.name
    if (item.name && typeof item.name === 'object' && item.name.first) return String(item.name.first)
    if (typeof item.firstName === 'string') return item.firstName
    if (typeof item.firstName === 'object' && item.firstName?.first) return String(item.firstName.first)
    return 'Unknown'
  }

  const getLastName = () => {
    if (itemType === 'employer' || itemType === 'listing' || itemType === 'review') {
      return ''
    }
    
    if (item.name && typeof item.name === 'object' && item.name.last) return String(item.name.last)
    if (typeof item.lastName === 'string') return item.lastName
    if (typeof item.lastName === 'object' && item.lastName?.last) return String(item.lastName.last)
    return ''
  }

  const firstName = String(getFirstName())
  const lastName = String(getLastName())
  const name = lastName.trim() ? `${firstName} ${lastName}`.trim() : firstName.trim()
  
  let email = item.email || 'No email provided'
  let description = ''
  
  if (itemType === 'employer') {
    description = item.location && item.industry ? `${item.location} • ${item.industry}` : item.industry || 'Employer account'
  } else if (itemType === 'listing') {
    const payRange = item.payRange ? `$${item.payRange.low.toLocaleString()} - $${item.payRange.high.toLocaleString()}` : 'Salary N/A'
    const skillsList = item.skills?.slice(0, 3).join(', ') || 'No skills listed'
    description = `${item.location} • ${payRange} • ${skillsList}`
    email = 'Job Listing'
  } else if (itemType === 'review') {
    description = item.comment || 'No comment provided'
    email = `Review by ${item.applicantName || item.applicantId || 'Unknown'} for ${item.employerName || item.employerId || 'Unknown'}`
  } else {
    description = item.description || 'Applicant registering for job opportunities'
  }
  
  const firstInitial = typeof firstName === 'string' ? firstName[0] || '' : ''
  const lastInitial = itemType === 'listing' ? (typeof item.location === 'string' ? item.location[0] || '' : '') : (typeof lastName === 'string' ? lastName[0] || '' : '')

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 flex gap-6 hover:shadow-md transition ${(item.isDeactivated || item.isClosed) ? 'opacity-60' : ''}`}>
      {itemType !== 'listing' && (
        <div className="shrink-0">
          {(itemType === 'employer' && item.logo) ? (
            <img src={`${API_BASE}${item.logo}`} alt="Logo" className="w-24 h-24 rounded-lg object-contain border border-gray-200 bg-white" />
          ) : (itemType === 'applicant' && item.profilePicture) ? (
            <img src={`${API_BASE}${item.profilePicture}`} alt="Profile" className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center">
              {itemType === 'review' ? (
                <span className="text-gray-600 text-3xl font-medium">★</span>
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {firstInitial}{lastInitial}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grow">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          {item.isDeactivated && itemType !== 'listing' && (
            <span className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 rounded">
              Deactivated
            </span>
          )}
          {item.isClosed && itemType === 'listing' && (
            <span className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 rounded">
              Closed
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-2">{email}</p>
        <p className="text-gray-500 text-sm mb-4">{description}</p>

        <div className="flex gap-2">
          {itemType === 'applicant' && (
            <button 
              onClick={() => onExplore && onExplore(item._id)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Explore
            </button>
          )}
          {itemType === 'listing' && (
            <button 
              onClick={() => onExplore && onExplore(item._id)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              View Applicants
            </button>
          )}
          <button
            onClick={() => onDelete(item._id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              (itemType === 'review' || itemType === 'listing')
                ? 'text-gray-700 bg-gray-100 hover:bg-red-100 hover:text-red-700'
                : item.isDeactivated
                  ? 'text-green-700 bg-green-100 hover:bg-green-200'
                  : 'text-gray-700 bg-gray-100 hover:bg-red-100 hover:text-red-700'
            }`}
          >
            {itemType === 'review' 
              ? 'Delete Review'
              : itemType === 'listing' 
                ? 'Delete Listing'
                : item.isDeactivated ? 'Reactivate' : 'Deactivate'}
          </button>
          {itemType !== 'review' && (
            <button
              onClick={() => onEdit(item._id)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemCard
