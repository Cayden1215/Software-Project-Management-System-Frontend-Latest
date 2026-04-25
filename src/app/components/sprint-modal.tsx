import { useState, useEffect } from 'react';
import { Sprint } from '../App';
import { X } from 'lucide-react';

interface SprintModalProps {
  sprint: Sprint | null;
  isManager: boolean;
  onSave: (sprint: Sprint) => void;
  onClose: () => void;
}

export function SprintModal({ sprint, isManager, onSave, onClose }: SprintModalProps) {
  const [formData, setFormData] = useState<Partial<Sprint>>({
    name: '',
    startDate: '',
    endDate: '',
    goal: '',
    status: 'planned',
    taskIds: [],
    ...sprint,
  });

  useEffect(() => {
    if (sprint) {
      setFormData(sprint);
    }
  }, [sprint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSprint: Sprint = {
      id: sprint?.id || `sprint-${Date.now()}`,
      name: formData.name || '',
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      goal: formData.goal || '',
      status: formData.status || 'planned',
      taskIds: formData.taskIds || [],
    };

    onSave(newSprint);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-gray-900">{sprint ? 'Edit Sprint' : 'Create New Sprint'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Sprint Name */}
            <div>
              <label className="block text-gray-700 mb-2">
                Sprint Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sprint 1, Design Sprint"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={!isManager}
              />
            </div>

            {/* Sprint Goal */}
            <div>
              <label className="block text-gray-700 mb-2">
                Sprint Goal *
              </label>
              <textarea
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="What do you want to achieve in this sprint?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                required
                disabled={!isManager}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={!isManager}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={!isManager}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Sprint['status'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={!isManager}
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {isManager && (
              <button
                type="submit"
                disabled={!formData.name || !formData.goal || !formData.startDate || !formData.endDate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sprint ? 'Save Changes' : 'Create Sprint'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
