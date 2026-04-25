import { useState } from 'react';
import { Project, Task } from '../App';
import { Plus, GripVertical, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TaskModal } from './task-modal';

interface KanbanBoardProps {
  project: Project;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
] as const;

export function KanbanBoard({ project, isManager, onUpdateProject }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Task['status']) => {
    if (!draggedTask) return;

    const updatedTasks = project.tasks.map(task =>
      task.id === draggedTask.id ? { ...task, status } : task
    );

    onUpdateProject({ ...project, tasks: updatedTasks });
    setDraggedTask(null);
  };

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
    onUpdateProject({ ...project, tasks: updatedTasks });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return project.tasks.filter(task => task.status === status);
  };

  return (
    <div className="h-[calc(100vh-240px)]">
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
              {isManager && column.id === 'todo' && (
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskModal(true);
                  }}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Add task"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {getTasksByStatus(column.id as Task['status']).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  allTasks={project.tasks}
                  onDragStart={() => handleDragStart(task)}
                  onClick={() => handleEditTask(task)}
                />
              ))}
            </div>
          </div>
        ))}
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

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  onDragStart: () => void;
  onClick: () => void;
}

function TaskCard({ task, allTasks, onDragStart, onClick }: TaskCardProps) {
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

  const hasDependencies = task.dependencies.length > 0;
  const dependencyTasks = allTasks.filter(t => task.dependencies.includes(t.id));
  const blockedByIncompleteTasks = dependencyTasks.some(t => t.status !== 'done');

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move border border-gray-200"
    >
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
    </div>
  );
}