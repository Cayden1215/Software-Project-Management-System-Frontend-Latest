import { useState, useEffect, useMemo } from 'react';
import { Task, Project } from '../App';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { skillAPI, SkillDto } from '../services/api-client';

interface TaskModalProps {
  task: Task | null;
  allTasks: Task[];
  project: Project;
  isManager: boolean;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onClose: () => void;
}

export function TaskModal({ task, allTasks, project, isManager, onSave, onDelete, onClose }: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    estimatedDuration: 1,
    requiredMemberNum: 1,
    dependencies: [],
    requiredSkills: [],
    priority: 'medium',
    ...task,
  });

  const [projectSkills, setProjectSkills] = useState<SkillDto[]>([]);

  useEffect(() => {
    if (task) {
      setFormData({ ...task, requiredMemberNum: task.requiredMemberNum ?? 1 });
    }
  }, [task]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const projectId = Number(project.id);
      if (!Number.isFinite(projectId) || projectId <= 0) return;

      try {
        const skillDtos = await skillAPI.getProjectSkills(projectId);
        if (cancelled) return;

        setProjectSkills(skillDtos || []);

        // If the backend only provided `skillIDs`, populate `requiredSkills` so
        // the UI + save flow can still work with skill names.
        setFormData((prev) => {
          const selectedIds = prev.skillIDs || [];
          const hasNames = (prev.requiredSkills?.length || 0) > 0;
          if (!selectedIds.length || hasNames) return prev;

          const names = (skillDtos || [])
            .filter((s) => typeof s.skillID === 'number' && selectedIds.includes(s.skillID))
            .map((s) => s.skillName)
            .filter((n): n is string => Boolean(n));

          if (names.length === 0) return prev;
          return { ...prev, requiredSkills: names };
        });
      } catch (e) {
        if (cancelled) return;
        setProjectSkills([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [project.id, task?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: formData.title || '',
      description: formData.description || '',
      status: formData.status || 'todo',
      assignee: formData.assignee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      estimatedDuration: formData.estimatedDuration || 1,
      requiredMemberNum: formData.requiredMemberNum ?? 1,
      dependencies: formData.dependencies || [],
      requiredSkills: formData.requiredSkills || [],
      skillIDs: formData.skillIDs || [],
      priority: formData.priority || 'medium',
      storyPoints: formData.storyPoints,
    };

    onSave(newTask);
  };

  const handleDependencyToggle = (taskId: string) => {
    const currentDeps = formData.dependencies || [];
    const newDeps = currentDeps.includes(taskId)
      ? currentDeps.filter(id => id !== taskId)
      : [...currentDeps, taskId];
    
    setFormData({ ...formData, dependencies: newDeps });
  };

  const availableDependencies = allTasks.filter(t => t.id !== task?.id);

  const skillOptions = useMemo(() => {
    if (projectSkills.length > 0) {
      return projectSkills
        .filter((s) => Boolean(s.skillName))
        .map((s) => ({
          id: typeof s.skillID === 'number' ? s.skillID : undefined,
          name: s.skillName,
        }));
    }

    const names =
      project.registeredSkills.length > 0
        ? project.registeredSkills
        : Array.from(new Set(project.teamMembers.flatMap((m) => m.skills)));

    return names.map((name) => ({ id: undefined as number | undefined, name }));
  }, [projectSkills, project.registeredSkills, project.teamMembers]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-gray-900">{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!isManager}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isManager}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-gray-700 mb-2">
                Duration (days) *
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={!isManager}
              />
            </div>

            {/* Required Members */}
            <div>
              <label className="block text-gray-700 mb-2">
                Required Members *
              </label>
              <input
                type="number"
                value={formData.requiredMemberNum ?? 1}
                onChange={(e) =>
                  setFormData({ ...formData, requiredMemberNum: Math.max(1, parseInt(e.target.value) || 1) })
                }
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={!isManager}
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum number of team members needed to work on this task
              </p>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-gray-700 mb-2">
                Story Points
              </label>
              <input
                type="number"
                value={formData.storyPoints || ''}
                onChange={(e) => setFormData({ ...formData, storyPoints: parseInt(e.target.value) || undefined })}
                min="0"
                placeholder="Optional Scrum estimation"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={!isManager}
              />
              <p className="text-sm text-gray-500 mt-1">
                Fibonacci scale: 1, 2, 3, 5, 8, 13, 21...
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isManager}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            {task && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}

            {/* Dependencies */}
            <div>
              <label className="block text-gray-700 mb-2">
                Dependencies
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Select tasks that must be completed before this task can start
              </p>
              
              {availableDependencies.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No other tasks available</p>
              ) : (
                <div className="border border-gray-300 rounded-lg divide-y max-h-48 overflow-y-auto">
                  {availableDependencies.map(depTask => (
                    <label
                      key={depTask.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.dependencies?.includes(depTask.id)}
                        onChange={() => handleDependencyToggle(depTask.id)}
                        className="mt-1"
                        disabled={!isManager}
                      />
                      <div className="flex-1">
                        <div className="text-gray-900">{depTask.title}</div>
                        <div className="text-sm text-gray-600">
                          Status: {depTask.status}
                          {depTask.status !== 'done' && (
                            <span className="ml-2 text-yellow-600 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Not completed
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-gray-700 mb-2">
                Required Skills
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Select skills needed to complete this task
              </p>
              
              {skillOptions.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  No skills available yet. Add project skills in Resource Management.
                </p>
              ) : (
                <div>
                  {skillOptions.map((skill) => (
                    <label
                      key={skill.id ?? skill.name}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          typeof skill.id === 'number'
                            ? (formData.skillIDs || []).includes(skill.id) ||
                              (formData.requiredSkills || []).includes(skill.name)
                            : (formData.requiredSkills || []).includes(skill.name)
                        }
                        onChange={(e) => {
                          const currentNames = formData.requiredSkills || [];
                          const nextNames = e.target.checked
                            ? Array.from(new Set([...currentNames, skill.name]))
                            : currentNames.filter((s) => s !== skill.name);

                          if (typeof skill.id === 'number') {
                            const currentIds = formData.skillIDs || [];
                            const nextIds = e.target.checked
                              ? Array.from(new Set([...currentIds, skill.id]))
                              : currentIds.filter((id) => id !== skill.id);

                            setFormData({ ...formData, requiredSkills: nextNames, skillIDs: nextIds });
                            return;
                          }

                          setFormData({ ...formData, requiredSkills: nextNames });
                        }}
                        disabled={!isManager}
                      />
                      <span className="text-gray-900">{skill.name}</span>
                      <span className="text-sm text-gray-500">
                        ({project.teamMembers.filter(m => m.skills.includes(skill.name)).length} members)
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            {(formData.startDate || formData.endDate) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div>
              {task && onDelete && isManager && (
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex gap-2">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {task ? 'Save Changes' : 'Create Task'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
