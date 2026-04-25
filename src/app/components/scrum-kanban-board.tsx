import { useState } from 'react';
import { Project, Task, Sprint, User } from '../App';
import { Plus, GripVertical, Clock, AlertCircle, CheckCircle2, Calendar, Target, ChevronDown, Edit2, Search, SlidersHorizontal, X } from 'lucide-react';
import { TaskModal } from './task-modal';
import { SprintModal } from './sprint-modal';

interface ScrumKanbanBoardProps {
  project: Project;
  currentUser: User;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
] as const;

export function ScrumKanbanBoard({ project, currentUser, isManager, onUpdateProject }: ScrumKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(() => {
    const activeSprint = project.sprints.find(s => s.status === 'active');
    return activeSprint || project.sprints[0] || null;
  });
  const [view, setView] = useState<'sprint' | 'backlog'>('sprint');

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Task['status']) => {
    if (!draggedTask) return;

    // Permission check: team members can only update their own tasks
    if (!isManager && draggedTask.assignee !== currentUser.email) {
      alert('You can only update the status of tasks assigned to you.');
      setDraggedTask(null);
      return;
    }

    const updatedTasks = project.tasks.map(task =>
      task.id === draggedTask.id ? { ...task, status } : task
    );

    onUpdateProject({ ...project, tasks: updatedTasks });
    setDraggedTask(null);
  };

  const handleSaveTask = (task: Task) => {
    const updatedTasks = project.tasks.map(t => t.id === task.id ? task : t);
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
    // Only managers or assigned team members can view task details
    if (!isManager && task.assignee !== currentUser.id) {
      return;
    }
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSaveSprint = (sprint: Sprint) => {
    let updatedSprints: Sprint[];
    
    if (editingSprint) {
      updatedSprints = project.sprints.map(s => s.id === sprint.id ? sprint : s);
      // If updating the selected sprint, update the selection too
      if (selectedSprint?.id === sprint.id) {
        setSelectedSprint(sprint);
      }
    } else {
      updatedSprints = [...project.sprints, sprint];
    }

    onUpdateProject({ ...project, sprints: updatedSprints });
    setShowSprintModal(false);
    setEditingSprint(null);
    
    if (!selectedSprint) {
      setSelectedSprint(sprint);
    }
  };

  const handleAddToSprint = (taskId: string, sprintId: string) => {
    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, sprintId } : task
    );

    const updatedSprints = project.sprints.map(sprint =>
      sprint.id === sprintId
        ? { ...sprint, taskIds: [...sprint.taskIds, taskId] }
        : sprint
    );

    onUpdateProject({ ...project, tasks: updatedTasks, sprints: updatedSprints });
  };

  const handleRemoveFromSprint = (taskId: string) => {
    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, sprintId: undefined } : task
    );

    const updatedSprints = project.sprints.map(sprint => ({
      ...sprint,
      taskIds: sprint.taskIds.filter(id => id !== taskId),
    }));

    onUpdateProject({ ...project, tasks: updatedTasks, sprints: updatedSprints });
  };

  const getTasksByStatus = (status: Task['status']) => {
    if (view === 'sprint' && selectedSprint) {
      return project.tasks.filter(task => 
        task.status === status && task.sprintId === selectedSprint.id
      );
    }
    return [];
  };

  const backlogTasks = project.tasks.filter(task => !task.sprintId);
  const sprintTasks = selectedSprint 
    ? project.tasks.filter(task => task.sprintId === selectedSprint.id)
    : [];

  const calculateSprintProgress = () => {
    if (!selectedSprint) return 0;
    const tasks = project.tasks.filter(task => task.sprintId === selectedSprint.id);
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    return (completedTasks / tasks.length) * 100;
  };

  const calculateStoryPoints = () => {
    if (!selectedSprint) return { total: 0, completed: 0 };
    const tasks = project.tasks.filter(task => task.sprintId === selectedSprint.id);
    const total = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completed = tasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    return { total, completed };
  };

  const progress = calculateSprintProgress();
  const storyPoints = calculateStoryPoints();

  // Sort backlog tasks by end date
  const sortedBacklogTasks = [...backlogTasks].sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Sprint Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-gray-900">
                {view === 'sprint' ? (selectedSprint?.name || 'No Sprint Selected') : 'Product Backlog'}
              </h2>
              {selectedSprint && view === 'sprint' && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedSprint.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedSprint.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedSprint.status}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => {
                        setEditingSprint(selectedSprint);
                        setShowSprintModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit sprint"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {view === 'sprint' && selectedSprint && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  <span>{selectedSprint.goal}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(selectedSprint.startDate).toLocaleDateString()} - {new Date(selectedSprint.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
            
            {view === 'backlog' && (
              <p className="text-sm text-gray-600">
                Tasks ordered by completion date ({backlogTasks.length} tasks)
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('sprint')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'sprint'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sprint
              </button>
              <button
                onClick={() => setView('backlog')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'backlog'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Backlog
              </button>
            </div>

            {isManager && (
              <button
                onClick={() => {
                  setEditingSprint(null);
                  setShowSprintModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Sprint
              </button>
            )}
          </div>
        </div>

        {/* Sprint Selection */}
        {view === 'sprint' && project.sprints.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {project.sprints.map(sprint => (
              <button
                key={sprint.id}
                onClick={() => setSelectedSprint(sprint)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedSprint?.id === sprint.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sprint.name}
              </button>
            ))}
          </div>
        )}

        {/* Sprint Progress */}
        {view === 'sprint' && selectedSprint && sprintTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-gray-900">{progress.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Story Points</div>
                <div className="text-gray-900">{storyPoints.completed} / {storyPoints.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tasks</div>
                <div className="text-gray-900">{sprintTasks.length} tasks</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board or Backlog List */}
      <div className="h-[calc(100vh-400px)]">
        {view === 'sprint' ? (
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {columns.map(column => (
              <div
                key={column.id}
                className="flex-1 min-w-[280px] bg-gray-100 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id as Task['status'])}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-900">{column.title}</h3>
                    <span className="px-2 py-1 bg-white rounded text-sm text-gray-600">
                      {getTasksByStatus(column.id as Task['status']).length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto">
                  {getTasksByStatus(column.id as Task['status']).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      allTasks={project.tasks}
                      project={project}
                      currentUser={currentUser}
                      isManager={isManager}
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => handleEditTask(task)}
                      onRemoveFromSprint={isManager ? () => handleRemoveFromSprint(task.id) : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <BacklogList
            tasks={sortedBacklogTasks}
            project={project}
            currentUser={currentUser}
            isManager={isManager}
            onEditTask={handleEditTask}
            onAddToSprint={handleAddToSprint}
          />
        )}
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

      {showSprintModal && (
        <SprintModal
          sprint={editingSprint}
          isManager={isManager}
          onSave={handleSaveSprint}
          onClose={() => {
            setShowSprintModal(false);
            setEditingSprint(null);
          }}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  project: Project;
  currentUser: User;
  isManager: boolean;
  onDragStart: () => void;
  onClick: () => void;
  onRemoveFromSprint?: () => void;
}

function TaskCard({ task, allTasks, project, currentUser, isManager, onDragStart, onClick, onRemoveFromSprint }: TaskCardProps) {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
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

  const hasDependencies = task.dependencies.length > 0;
  const dependencyTasks = allTasks.filter(t => task.dependencies.includes(t.id));
  const blockedByIncompleteTasks = dependencyTasks.some(t => t.status !== 'done');

  const assignedMember = project.teamMembers.find(m => m.email === task.assignee);
  
  // Check if this task is assigned to the current user
  const isMyTask = task.assignee === currentUser.email;

  // Check if current user can drag this task
  const canDrag = isManager || task.assignee === currentUser.email;

  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border-2 group ${
        isMyTask 
          ? 'border-purple-400 bg-purple-50' 
          : !canDrag 
          ? 'border-gray-200 opacity-75' 
          : 'border-gray-200'
      }`}
    >
      <div onClick={onClick} className="cursor-pointer">
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="text-gray-900">{task.title}</h4>
            {task.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)} bg-opacity-10 bg-current`}>
            {task.priority}
          </span>
          
          {task.storyPoints !== undefined && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              {task.storyPoints} pts
            </span>
          )}

          {task.duration && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              {task.duration}d
            </span>
          )}

          {hasDependencies && (
            <span className={`flex items-center gap-1 text-xs ${blockedByIncompleteTasks ? 'text-red-600' : 'text-green-600'}`}>
              {blockedByIncompleteTasks ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Blocked
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Ready
                </>
              )}
            </span>
          )}
        </div>

        {assignedMember && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xs text-purple-700">
                {assignedMember.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <span className="text-xs text-gray-600">{assignedMember.name}</span>
          </div>
        )}
      </div>

      {/* Sprint Actions */}
      {isManager && onRemoveFromSprint && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromSprint();
            }}
            className="w-full px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Move to Backlog
          </button>
        </div>
      )}
    </div>
  );
}

interface BacklogListProps {
  tasks: Task[];
  project: Project;
  currentUser: User;
  isManager: boolean;
  onEditTask: (task: Task) => void;
  onAddToSprint: (taskId: string, sprintId: string) => void;
}

function BacklogList({ tasks, project, currentUser, isManager, onEditTask, onAddToSprint }: BacklogListProps) {
  const [selectedTaskForSprint, setSelectedTaskForSprint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority-high' | 'priority-low' | 'date-asc' | 'date-desc' | 'schedule-asc' | 'schedule-desc'>('schedule-asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high'>('all');
  const [showFilters, setShowFilters] = useState(false);

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
  let filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || task.status === 'todo';
    
    // Priority filter
    const matchesPriority = filterPriority === 'all' || task.priority === 'high';
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort tasks
  filteredTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority-high':
        return getPriorityValue(b.priority) - getPriorityValue(a.priority);
      case 'priority-low':
        return getPriorityValue(a.priority) - getPriorityValue(b.priority);
      case 'date-asc':
        // Recently added = newer first (descending by ID/creation)
        return a.id.localeCompare(b.id);
      case 'date-desc':
        // Oldest first = ascending by ID/creation
        return b.id.localeCompare(a.id);
      case 'schedule-asc':
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'schedule-desc':
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      default:
        return 0;
    }
  });

  const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header with Search, Sort, and Filter */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10 space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="schedule-asc">Schedule: Earliest First</option>
            <option value="schedule-desc">Schedule: Latest First</option>
            <option value="priority-high">Priority: High to Low</option>
            <option value="priority-low">Priority: Low to High</option>
            <option value="date-desc">Recently Added</option>
            <option value="date-asc">Oldest First</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="todo">To Do Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Priority:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="high">High Priority Only</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                }}
                className="ml-auto px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>
      
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">
            {searchQuery || activeFiltersCount > 0
              ? 'No tasks match your search or filters'
              : 'No tasks in backlog. All tasks have been assigned to sprints.'
            }
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 overflow-y-auto">
          {filteredTasks.map(task => {
            const hasDependencies = task.dependencies.length > 0;
            const dependencyTasks = project.tasks.filter(t => task.dependencies.includes(t.id));
            const blockedByIncompleteTasks = dependencyTasks.some(t => t.status !== 'done');
            const assignedMember = project.teamMembers.find(m => m.email === task.assignee);

            return (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => onEditTask(task)} role="button">
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
                      <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.duration} days
                      </span>

                      {task.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(task.endDate).toLocaleDateString()}
                        </span>
                      )}

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
                    </div>
                  </div>

                  {isManager && project.sprints.length > 0 && (
                    <div className="ml-4 relative">
                      <button
                        onClick={() => setSelectedTaskForSprint(selectedTaskForSprint === task.id ? null : task.id)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        Add to Sprint
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {selectedTaskForSprint === task.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          {project.sprints.map(sprint => (
                            <button
                              key={sprint.id}
                              onClick={() => {
                                onAddToSprint(task.id, sprint.id);
                                setSelectedTaskForSprint(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="text-sm text-gray-900">{sprint.name}</div>
                              <div className="text-xs text-gray-600">
                                {sprint.status} • {new Date(sprint.startDate).toLocaleDateString()}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}