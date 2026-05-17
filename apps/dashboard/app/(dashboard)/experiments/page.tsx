export default function ExperimentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Experiments</h1>
        <button className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          + New experiment
        </button>
      </div>
      <p className="text-gray-500 text-sm">No experiments yet.</p>
    </div>
  )
}
