import { useState } from 'react';
import { Project, Task } from '../App';
import { Plus, GripVertical, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TaskModal } from './task-modal';
import { skillAPI, taskAPI, TaskDto } from '../services/api-client';
import { toast } from 'sonner';

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
  const [isBusy, setIsBusy] = useState(false);

  const refreshTasks = async () => {
    const projectId = parseInt(project.id);
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    const taskDtos = await taskAPI.getProjectTasks(projectId);
    const convertedTasks: Task[] = taskDtos.map((dto) => ({
      id: dto.taskID?.toString() || '',
      title: dto.taskName,
      description: dto.description,
      status: (dto.taskStatus as Task['status']) || 'todo',
      assignee: dto.assignee,
      requiredSkills: dto.requiredSkills || [],
      skillIDs: dto.skillIDs || [],
      startDate: dto.startDate,
      endDate: dto.endDate,
      estimatedDuration: dto.estimatedDuration || 0,
      requiredMemberNum: dto.requiredMemberNum ?? 1,
      dependencies: (dto.dependencyIds || []).map((id) => id.toString()),
      priority: (dto.priority as Task['priority']) || 'medium',
      sprintId: dto.sprintID?.toString(),
      storyPoints: dto.storyPoints,
    }));

    onUpdateProject({ ...project, tasks: convertedTasks });
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: Task['status']) => {
    if (!draggedTask) return;

    try {
      // Update task status via API
      const projectId = parseInt(project.id);
      const taskId = parseInt(draggedTask.id);

      const skillDtos = await skillAPI.getProjectSkills(projectId).catch(() => []);
      const skillIdByName: Record<string, number> = {};
      for (const s of skillDtos) {
        if (s.skillName && typeof s.skillID === 'number') {
          skillIdByName[s.skillName] = s.skillID;
        }
      }
      const skillIDs = (draggedTask.requiredSkills ?? [])
        .map((name) => skillIdByName[name])
        .filter((id): id is number => Number.isFinite(id));
      
      const updatedTaskData = {
        taskID: taskId,
        projectID: projectId,
        taskName: draggedTask.title,
        description: draggedTask.description,
        taskStatus: status,
        priority: draggedTask.priority,
        estimatedDuration: draggedTask.estimatedDuration ?? 1,
        requiredMemberNum: draggedTask.requiredMemberNum ?? 1,
        assignee: draggedTask.assignee,
        requiredSkills: draggedTask.requiredSkills,
        skillIds: skillIDs,
        startDate: draggedTask.startDate,
        endDate: draggedTask.endDate,
        dependencyIds: draggedTask.dependencies.map(d => parseInt(d)),
        storyPoints: draggedTask.storyPoints,
      };

      await taskAPI.updateTask(projectId, taskId, updatedTaskData);

      // Update local state
      const updatedTasks = project.tasks.map(task =>
        task.id === draggedTask.id ? { ...task, status } : task
      );

      onUpdateProject({ ...project, tasks: updatedTasks });
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    }
    
    setDraggedTask(null);
  };

  const handleSaveTask = async (task: Task) => {
    const projectId = parseInt(project.id);
    if (!Number.isFinite(projectId) || projectId <= 0) return;

    const skillDtos = await skillAPI.getProjectSkills(projectId).catch(() => []);
    const skillIdByName: Record<string, number> = {};
    for (const s of skillDtos) {
      if (s.skillName && typeof s.skillID === 'number') {
        skillIdByName[s.skillName] = s.skillID;
      }
    }
    const skillIDs = (task.requiredSkills ?? [])
      .map((name) => skillIdByName[name])
      .filter((id): id is number => Number.isFinite(id));

    const taskDto: TaskDto = {
      taskID: editingTask ? parseInt(task.id) : undefined,
      projectID: projectId,
      taskName: task.title,
      description: task.description,
      taskStatus: task.status,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration ?? 1,
      requiredMemberNum: task.requiredMemberNum ?? 1,
      assignee: task.assignee,
      requiredSkills: task.requiredSkills ?? [],
      skillIds: skillIDs,
      startDate: task.startDate,
      endDate: task.endDate,
      dependencyIds: task.dependencies.map((id) => parseInt(id)).filter((n) => Number.isFinite(n)),
      sprintID: task.sprintId ? parseInt(task.sprintId) : undefined,
      storyPoints: task.storyPoints,
    };

    try {
      setIsBusy(true);
      if (editingTask) {
        await taskAPI.updateTask(projectId, parseInt(task.id), taskDto);
        toast.success('Task updated');
      } else {
        await taskAPI.createTask(projectId, taskDto);
        toast.success('Task created');
      }

      await refreshTasks();
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (e) {
      console.error('Failed to save task:', e);
      toast.error('Failed to save task');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const projectId = parseInt(project.id);
    const idNum = parseInt(taskId);
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    if (!Number.isFinite(idNum) || idNum <= 0) return;

    try {
      setIsBusy(true);
      await taskAPI.deleteTask(projectId, idNum);
      toast.success('Task deleted');
      await refreshTasks();
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (e) {
      console.error('Failed to delete task:', e);
      toast.error('Failed to delete task');
    } finally {
      setIsBusy(false);
    }
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
        
        {task.estimatedDuration && (
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            {task.estimatedDuration}d
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
