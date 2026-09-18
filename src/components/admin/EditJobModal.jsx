import JobForm from '../employers/JobForm'

function EditJobModal({ job, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Job: {job?.title || 'Untitled'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <JobForm job={job} onSave={onSave} onCancel={onClose} isModal={true} />
      </div>
    </div>
  )
}

export default EditJobModal
