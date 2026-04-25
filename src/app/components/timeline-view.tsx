import { useMemo, useState } from 'react';
import { Project, Task } from '../App';
import { ArrowRight, AlertCircle, Sparkles, X, Plus, Calendar as CalendarIcon, Edit2, Search } from 'lucide-react';
import { AIScheduler } from './ai-scheduler';

interface TimelineViewProps {
  project: Project;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

export function TimelineView({ project, isManager, onUpdateProject }: TimelineViewProps) {
  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTaskDates, setEditingTaskDates] = useState<Task | null>(null);

  const timelineData = useMemo(() => {
    if (project.tasks.length === 0) return null;

    // Calculate date range
    const dates = project.tasks
      .filter(t => t.startDate)
      .map(t => new Date(t.startDate!).getTime());
    
    if (dates.length === 0) return null;

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Calculate task end dates
    const tasksWithDates = project.tasks.filter(t => t.startDate).map(task => {
      const start = new Date(task.startDate!);
      const end = task.endDate ? new Date(task.endDate) : new Date(start);
      if (!task.endDate) {
        end.setDate(end.getDate() + task.duration);
      }
      return { ...task, startDate: start, endDate: end };
    });

    // Add buffer days
    maxDate.setDate(maxDate.getDate() + 30);

    return { minDate, maxDate, tasksWithDates };
  }, [project.tasks]);

  const handleAddTaskToTimeline = (taskId: string, startDate: string) => {
    const updatedTasks = project.tasks.map(task => {
      if (task.id === taskId) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + task.duration);
        return {
          ...task,
          startDate,
          endDate: end.toISOString().split('T')[0],
        };
      }
      return task;
    });

    onUpdateProject({ ...project, tasks: updatedTasks });
    setShowAddTaskModal(false);
  };

  const handleUpdateTaskDates = (taskId: string, startDate: string, endDate: string) => {
    const updatedTasks = project.tasks.map(task => {
      if (task.id === taskId) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...task,
          startDate,
          endDate,
          duration: Math.max(1, duration),
        };
      }
      return task;
    });

    onUpdateProject({ ...project, tasks: updatedTasks });
    setEditingTaskDates(null);
  };

  const unscheduledTasks = project.tasks.filter(t => !t.startDate);

  if (!timelineData || timelineData.tasksWithDates.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-gray-900 mb-2">No Timeline Data</h3>
        <p className="text-gray-600 mb-4">
          Tasks need start dates to appear in the timeline view.
          {isManager && ' Use the AI Scheduler or manually add tasks to the timeline.'}
        </p>
        {isManager && (
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              onClick={() => setShowAIScheduler(true)}
            >
              <Sparkles className="w-4 h-4" />
              AI Scheduler
            </button>
            {unscheduledTasks.length > 0 && (
              <button
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-2"
                onClick={() => setShowAddTaskModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Task to Timeline
              </button>
            )}
          </div>
        )}
        {showAIScheduler && (
          <AIScheduler
            project={project}
            onClose={() => setShowAIScheduler(false)}
            onUpdateProject={onUpdateProject}
          />
        )}
        {showAddTaskModal && (
          <AddTaskToTimelineModal
            tasks={unscheduledTasks}
            onAdd={handleAddTaskToTimeline}
            onClose={() => setShowAddTaskModal(false)}
          />
        )}
      </div>
    );
  }

  const { minDate, maxDate, tasksWithDates } = timelineData;
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const getTaskPosition = (startDate: Date, duration: number) => {
    const startOffset = Math.ceil((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-600';
      case 'in-progress':
        return 'bg-blue-600';
      case 'review':
        return 'bg-yellow-600';
      case 'todo':
        return 'bg-gray-400';
    }
  };

  // Generate month markers
  const generateMonthMarkers = () => {
    const markers = [];
    const current = new Date(minDate);
    current.setDate(1); // Start of month

    while (current <= maxDate) {
      const offset = Math.ceil((current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const position = (offset / totalDays) * 100;
      
      markers.push({
        date: new Date(current),
        position,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  };

  const monthMarkers = generateMonthMarkers();

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Project Timeline</h2>
          <p className="text-gray-600">
            {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()}
          </p>
        </div>
        {isManager && unscheduledTasks.length > 0 && (
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task ({unscheduledTasks.length})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month headers */}
          <div className="relative h-8 mb-2 border-b border-gray-200">
            {monthMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 text-sm text-gray-600"
                style={{ left: `${marker.position}%` }}
              >
                {marker.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="relative">
            <div className="absolute inset-0 flex">
              {monthMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 border-l border-gray-200"
                  style={{ left: `${marker.position}%` }}
                />
              ))}
            </div>

            {/* Tasks */}
            <div className="space-y-3 relative">
              {tasksWithDates.map((task) => {
                const position = getTaskPosition(task.startDate as Date, task.duration);
                const dependencies = project.tasks.filter(t => task.dependencies.includes(t.id));
                const assignedMember = project.teamMembers.find(m => m.email === task.assignee);

                return (
                  <div key={task.id} className="relative h-16">
                    <div className="absolute left-0 top-0 bottom-0 flex items-center w-48 pr-4">
                      <div>
                        <div className="text-gray-900 text-sm truncate">{task.title}</div>
                        <div className="text-xs text-gray-600">{task.duration} days</div>
                      </div>
                    </div>
                    
                    <div className="ml-48 relative h-full flex items-center">
                      <div
                        className={`absolute h-8 ${getStatusColor(task.status)} rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer group`}
                        style={position}
                      >
                        <div className="h-full flex items-center justify-between px-3">
                          <span className="text-white text-sm truncate">{task.title}</span>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} />
                            {isManager && (
                              <button
                                onClick={() => setEditingTaskDates(task as any)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                title="Edit dates"
                              >
                                <Edit2 className="w-3 h-3 text-white" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-lg">
                            <div className="font-medium">{task.title}</div>
                            <div className="text-gray-300 mt-1">
                              {(task.startDate as Date).toLocaleDateString()} - {(task.endDate as Date).toLocaleDateString()}
                            </div>
                            {assignedMember && (
                              <div className="text-gray-300 mt-1 flex items-center gap-2">
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-[10px] text-white">
                                    {assignedMember.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <span>Assigned to: {assignedMember.name}</span>
                              </div>
                            )}
                            {dependencies.length > 0 && (
                              <div className="text-gray-300 mt-1">
                                Depends on: {dependencies.map(d => d.title).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dependency arrows */}
                      {dependencies.map(dep => {
                        if (!dep.startDate) return null;
                        const depEnd = new Date(dep.startDate);
                        depEnd.setDate(depEnd.getDate() + dep.duration);
                        const taskStart = task.startDate as Date;
                        
                        if (depEnd < taskStart) {
                          return (
                            <div
                              key={dep.id}
                              className="absolute top-1/2 h-0.5 bg-gray-400 pointer-events-none"
                              style={{
                                left: getTaskPosition(depEnd, 0).left,
                                width: `calc(${position.left} - ${getTaskPosition(depEnd, 0).left})`,
                              }}
                            >
                              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded" />
              <span className="text-gray-600">To Do</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-600 rounded" />
              <span className="text-gray-600">Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded" />
              <span className="text-gray-600">Done</span>
            </div>
          </div>
          
          {isManager && (
            <button
              onClick={() => setShowAIScheduler(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Scheduler
            </button>
          )}
        </div>
      </div>

      {/* AI Scheduler Modal */}
      {showAIScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-gray-900">AI Project Scheduler</h2>
              <button
                onClick={() => setShowAIScheduler(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <AIScheduler
                project={project}
                onClose={() => setShowAIScheduler(false)}
                onUpdateProject={onUpdateProject}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Task to Timeline Modal */}
      {showAddTaskModal && (
        <AddTaskToTimelineModal
          tasks={unscheduledTasks}
          onAdd={handleAddTaskToTimeline}
          onClose={() => setShowAddTaskModal(false)}
        />
      )}

      {/* Edit Task Dates Modal */}
      {editingTaskDates && (
        <EditTaskDatesModal
          task={editingTaskDates}
          onSave={handleUpdateTaskDates}
          onClose={() => setEditingTaskDates(null)}
        />
      )}
    </div>
  );
}

interface AddTaskToTimelineModalProps {
  tasks: Task[];
  onAdd: (taskId: string, startDate: string) => void;
  onClose: () => void;
}

function AddTaskToTimelineModal({ tasks, onAdd, onClose }: AddTaskToTimelineModalProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority-high' | 'priority-low' | 'date-asc' | 'date-desc'>('priority-high');

  const getPriorityValue = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority-high':
        return getPriorityValue(b.priority) - getPriorityValue(a.priority);
      case 'priority-low':
        return getPriorityValue(a.priority) - getPriorityValue(b.priority);
      case 'date-asc':
        return a.id.localeCompare(b.id);
      case 'date-desc':
        return b.id.localeCompare(a.id);
      default:
        return 0;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskId) {
      onAdd(selectedTaskId, startDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-gray-900">Add Task to Timeline</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 flex-shrink-0">
            {/* Search and Sort */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="priority-high">Priority: High to Low</option>
                <option value="priority-low">Priority: Low to High</option>
                <option value="date-desc">Recently Added</option>
                <option value="date-asc">Oldest First</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto border-t border-b border-gray-200">
            {sortedTasks.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  {searchQuery ? 'No tasks match your search' : 'No tasks available'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedTasks.map(task => {
                  const getPriorityColor = (priority: Task['priority']) => {
                    switch (priority) {
                      case 'high':
                        return 'bg-red-100 text-red-700';
                      case 'medium':
                        return 'bg-yellow-100 text-yellow-700';
                      case 'low':
                        return 'bg-green-100 text-green-700';
                    }
                  };

                  return (
                    <label
                      key={task.id}
                      className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTaskId === task.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedTask"
                        value={task.id}
                        checked={selectedTaskId === task.id}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900">{task.title}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-sm text-gray-600">({task.duration} days)</span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                        )}
                        {task.requiredSkills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {task.requiredSkills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {task.requiredSkills.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{task.requiredSkills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedTaskId && (
            <div className="p-4 bg-blue-50 border-t border-blue-100 flex-shrink-0">
              <div className="text-sm text-blue-700">
                <strong>{tasks.find(t => t.id === selectedTaskId)?.title}</strong> will be scheduled from {new Date(startDate).toLocaleDateString()} 
                {' '}(Duration: {tasks.find(t => t.id === selectedTaskId)?.duration} days)
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTaskId}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Timeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditTaskDatesModalProps {
  task: Task;
  onSave: (taskId: string, startDate: string, endDate: string) => void;
  onClose: () => void;
}

function EditTaskDatesModal({ task, onSave, onClose }: EditTaskDatesModalProps) {
  const [startDate, setStartDate] = useState<string>(task.startDate || '');
  const [endDate, setEndDate] = useState<string>(task.endDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        onSave(task.id, startDate, endDate);
      } else {
        alert('End date must be after start date');
      }
    }
  };

  const calculateDuration = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, duration);
    }
    return task.duration;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900">Edit Task Dates</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="text-gray-900 mb-1">{task.title}</div>
            <div className="text-sm text-gray-600">
              Current duration: {task.duration} days
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                New duration: {calculateDuration()} days
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}