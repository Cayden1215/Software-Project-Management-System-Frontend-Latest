import { useState } from 'react';
import { Project, Task } from '../App';
import { Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { TaskModal } from './task-modal';

interface TaskManagementProps {
  project: Project;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

export function TaskManagement({ project, isManager, onUpdateProject }: TaskManagementProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority-high' | 'priority-low' | 'date-asc' | 'date-desc'>('date-desc');

  const handleSaveTask = (task: Task) => {
    let updatedTasks: Task[];
    
    if (editingTask) {
      updatedTasks = project.tasks.map(t => t.id === task.id ? task : t);
    } else {
      updatedTasks = [...project.tasks, task];
    }

    onUpdateProject({ ...project, tasks: updatedTasks });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    
    // Remove task from sprint if it was in one
    const updatedSprints = project.sprints.map(sprint => ({
      ...sprint,
      taskIds: sprint.taskIds.filter(id => id !== taskId),
    }));

    onUpdateProject({ ...project, tasks: updatedTasks, sprints: updatedSprints });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-yellow-100 text-yellow-700';
      case 'todo':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'Done';
      case 'in-progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'todo':
        return 'To Do';
    }
  };

  // Filter tasks
  const filteredTasks = project.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort tasks
  const sortedTasks = filteredTasks.sort((a, b) => {
    switch (sortBy) {
      case 'priority-high':
        return a.priority === 'high' ? -1 : (b.priority === 'high' ? 1 : 0);
      case 'priority-low':
        return a.priority === 'low' ? -1 : (b.priority === 'low' ? 1 : 0);
      case 'date-asc':
        return a.startDate ? (b.startDate ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime() : -1) : 1;
      case 'date-desc':
        return a.startDate ? (b.startDate ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime() : 1) : -1;
      default:
        return 0;
    }
  });

  // Calculate statistics
  const stats = {
    total: project.tasks.length,
    todo: project.tasks.filter(t => t.status === 'todo').length,
    inProgress: project.tasks.filter(t => t.status === 'in-progress').length,
    review: project.tasks.filter(t => t.status === 'review').length,
    done: project.tasks.filter(t => t.status === 'done').length,
    inBacklog: project.tasks.filter(t => !t.sprintId).length,
    inSprints: project.tasks.filter(t => t.sprintId).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900 mb-2">Task Management</h2>
            <p className="text-gray-600">
              Centralized task registration and management. All tasks must be created here.
            </p>
          </div>
          {isManager && (
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register New Task
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
            <div className="text-2xl text-gray-900">{stats.total}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">In Progress</div>
            <div className="text-2xl text-blue-900">{stats.inProgress}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">In Backlog</div>
            <div className="text-2xl text-purple-900">{stats.inBacklog}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Completed</div>
            <div className="text-2xl text-green-900">{stats.done}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Task['status'] | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Task['priority'] | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'priority-high' | 'priority-low' | 'date-asc' | 'date-desc')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc">Sort by Date (Newest First)</option>
              <option value="date-asc">Sort by Date (Oldest First)</option>
              <option value="priority-high">Sort by Priority (High First)</option>
              <option value="priority-low">Sort by Priority (Low First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">
            All Tasks ({filteredTasks.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedTasks.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'No tasks match your filters'
                  : 'No tasks registered yet. Create your first task to get started.'}
              </p>
            </div>
          ) : (
            sortedTasks.map(task => {
              const hasDependencies = task.dependencies.length > 0;
              const dependencyTasks = project.tasks.filter(t => task.dependencies.includes(t.id));
              const blockedByIncompleteTasks = dependencyTasks.some(t => t.status !== 'done');
              const assignedMember = project.teamMembers.find(m => m.email === task.assignee);
              const sprint = project.sprints.find(s => s.id === task.sprintId);

              return (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        {task.storyPoints !== undefined && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {task.storyPoints} pts
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {task.duration} days
                        </span>

                        {assignedMember && (
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-xs text-purple-700">
                                {assignedMember.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            {assignedMember.name}
                          </span>
                        )}

                        {sprint && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {sprint.name}
                          </span>
                        )}

                        {!sprint && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            Backlog
                          </span>
                        )}

                        {hasDependencies && (
                          <span className={`flex items-center gap-1 ${blockedByIncompleteTasks ? 'text-red-600' : 'text-green-600'}`}>
                            {blockedByIncompleteTasks ? (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                Blocked by {dependencyTasks.filter(t => t.status !== 'done').length} task(s)
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Dependencies complete
                              </>
                            )}
                          </span>
                        )}

                        {task.startDate && task.endDate && (
                          <span>
                            {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {task.requiredSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.requiredSkills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {isManager && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                              handleDeleteTask(task.id);
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          allTasks={project.tasks}
          project={project}
          isManager={isManager}
          onSave={handleSaveTask}
          onDelete={editingTask ? handleDeleteTask : undefined}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}