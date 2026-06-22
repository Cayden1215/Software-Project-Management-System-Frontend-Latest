import { type PointerEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Link2, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Project, Task } from '../App';
import { schedulerAPI, taskAssignmentAPI, type TaskAssignmentDto } from '../services/api-client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface GanttChartViewProps {
  project: Project;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

type TimelineTask = Task & {
  start: Date;
  end: Date;
  durationDays: number;
  offsetDays: number;
  assignment?: TaskAssignmentDto;
};

type DragMode = 'move' | 'resize-start' | 'resize-end';

type TimelineDragState = {
  taskId: string;
  taskTitle: string;
  mode: DragMode;
  originClientX: number;
  originStart: Date;
  originEnd: Date;
  previewStart: Date;
  previewEnd: Date;
  daysDelta: number;
  assignedMemberIds: number[];
};

const dayMs = 1000 * 60 * 60 * 24;
const minColumnWidth = 42;
const taskRowHeight = 58;

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const diffDays = (start: Date, end: Date): number => {
  return Math.round((normalizeDate(end).getTime() - normalizeDate(start).getTime()) / dayMs);
};

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const durationFromDates = (start: Date, end: Date): number => {
  return Math.max(1, diffDays(start, end) || 1);
};

const convertTaskAssignmentDto = (dto: TaskAssignmentDto, fallbackTask?: Task): Task => {
  const taskId = dto.taskID?.toString() || fallbackTask?.id || dto.assignmentID?.toString() || '';
  const startDate = dto.scheduledStartDate || fallbackTask?.startDate;
  const endDate = dto.scheduledEndDate || fallbackTask?.endDate;

  return {
    id: taskId,
    title: dto.taskName || fallbackTask?.title || 'Untitled Task',
    description: fallbackTask?.description || '',
    status: fallbackTask?.status || 'todo',
    assignee: dto.assignedMemberNames?.join(', ') || fallbackTask?.assignee,
    assignedMemberIds: dto.assignedMemberIds || fallbackTask?.assignedMemberIds || [],
    requiredSkills: fallbackTask?.requiredSkills || [],
    skillIDs: fallbackTask?.skillIDs || [],
    startDate,
    endDate,
    estimatedDuration: fallbackTask?.estimatedDuration || 1,
    requiredMemberNum: dto.requiredMemberNum ?? fallbackTask?.requiredMemberNum ?? 1,
    dependencies: fallbackTask?.dependencies || [],
    sprintId: fallbackTask?.sprintId,
    storyPoints: fallbackTask?.storyPoints,
  };
};

const getStatusClasses = (status: Task['status']) => {
  switch (status) {
    case 'done':
      return {
        bar: 'bg-emerald-600',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Done',
      };
    case 'in-progress':
      return {
        bar: 'bg-blue-600',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'In Progress',
      };
    case 'review':
      return {
        bar: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Review',
      };
    case 'todo':
    default:
      return {
        bar: 'bg-slate-500',
        badge: 'bg-slate-50 text-slate-700 border-slate-200',
        label: 'To Do',
      };
  }
};

export function GanttChartView({ project, isManager, onUpdateProject }: GanttChartViewProps) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks || []);
  const [assignments, setAssignments] = useState<TaskAssignmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<TimelineDragState | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [unassignedTasksLoading, setUnassignedTasksLoading] = useState(false);
  const [unassignedTasksError, setUnassignedTasksError] = useState<string | null>(null);
  const [addTaskFormData, setAddTaskFormData] = useState({
    selectedTaskId: '',
    startDate: '',
    endDate: '',
    assignedMemberIds: [] as number[],
  });

  const refreshTasks = useCallback(async () => {
    const projectId = Number(project.id);
    if (!Number.isFinite(projectId) || projectId <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const assignmentDtos = await taskAssignmentAPI.getTaskAssignments(projectId);
      const projectTaskById = new Map((project.tasks || []).map((task) => [task.id, task]));
      const nextTasks = assignmentDtos
        .map((assignment) => convertTaskAssignmentDto(
          assignment,
          assignment.taskID != null ? projectTaskById.get(String(assignment.taskID)) : undefined,
        ))
        .filter((task) => task.id);

      setAssignments(assignmentDtos);
      setTasks(nextTasks);
      setLastRefresh(new Date());
      onUpdateProject({ ...project, tasks: nextTasks });
    } catch (err: any) {
      console.error('Failed to load Gantt task assignments:', err);
      const message = err?.message || 'Failed to load Gantt data from task assignments API';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [onUpdateProject, project]);

  const fetchUnassignedTasks = useCallback(async () => {
    const projectId = Number(project.id);
    if (!Number.isFinite(projectId) || projectId <= 0) return;

    setUnassignedTasksLoading(true);
    setUnassignedTasksError(null);

    try {
      const unassignedTaskDtos = await taskAssignmentAPI.getUnassignedTasks(projectId);
      // Convert TaskDto objects to Task objects for component usage
      const convertedTasks: Task[] = unassignedTaskDtos.map((dto) => ({
        id: String(dto.taskID || ''),
        title: dto.taskName || 'Untitled Task',
        description: dto.description || '',
        status: (dto.taskStatus as Task['status']) || 'todo',
        assignee: dto.assignee,
        assignedMemberIds: dto.assignedMemberIds || [],
        requiredSkills: dto.requiredSkills || [],
        skillIDs: dto.skillIDs || [],
        startDate: dto.startDate,
        endDate: dto.endDate,
        estimatedDuration: dto.estimatedDuration || 1,
        requiredMemberNum: dto.requiredMemberNum ?? 1,
        dependencies: dto.dependencyIds || [],
        sprintId: dto.sprintID,
        storyPoints: dto.storyPoints,
      })).filter((task) => task.id);
      
      setUnassignedTasks(convertedTasks);
    } catch (err: any) {
      console.error('Failed to load unassigned tasks:', err);
      const message = err?.message || 'Failed to load unassigned tasks';
      setUnassignedTasksError(message);
      // Don't toast error for unassigned tasks - they're secondary
    } finally {
      setUnassignedTasksLoading(false);
    }
  }, [project.id]);

  // Initial fetch on component mount
  useEffect(() => {
    refreshTasks();
    fetchUnassignedTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Update handleAddTaskSubmit to refresh unassigned tasks after successful add
  const handleAddTaskSubmit = useCallback(async () => {
    if (!addTaskFormData.selectedTaskId || !addTaskFormData.startDate || !addTaskFormData.endDate) {
      toast.error('Please select a task and provide start and end dates');
      return;
    }

    const projectId = Number(project.id);
    const taskId = Number(addTaskFormData.selectedTaskId);

    if (!Number.isFinite(projectId) || projectId <= 0 || !Number.isFinite(taskId) || taskId <= 0) {
      toast.error('Invalid project or task ID');
      return;
    }

    const startDate = new Date(addTaskFormData.startDate);
    const endDate = new Date(addTaskFormData.endDate);

    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    setAddingTaskId(addTaskFormData.selectedTaskId);

    try {
      const selectedTask = unassignedTasks.find((t) => t.id === addTaskFormData.selectedTaskId);
      await schedulerAPI.manualScheduleTask(projectId, taskId, {
        assignedMemberIds: addTaskFormData.assignedMemberIds,
        scheduledStartDate: toDateInputValue(startDate),
        scheduledEndDate: toDateInputValue(endDate),
      });

      toast.success(`${selectedTask?.title || 'Task'} added to Gantt chart`);
      setShowAddTaskModal(false);
      setAddTaskFormData({
        selectedTaskId: '',
        startDate: '',
        endDate: '',
        assignedMemberIds: [],
      });
      await refreshTasks();
      await fetchUnassignedTasks();
    } catch (err: any) {
      console.error('Failed to add task to Gantt chart:', err);
      toast.error(err?.message || 'Failed to add task to Gantt chart');
    } finally {
      setAddingTaskId(null);
    }
  }, [addTaskFormData, unassignedTasks, project, refreshTasks, fetchUnassignedTasks]);

  const timeline = useMemo(() => {
    const projectStart = parseDate(project.createdAt) || new Date();
    const baseStart = normalizeDate(projectStart);

    const timelineTasks: TimelineTask[] = tasks
      .filter((task) => task.id)
      .map((task) => {
        const start = normalizeDate(parseDate(task.startDate) || baseStart);
        const fallbackDuration = Math.max(1, Math.round(task.estimatedDuration || 1));
        const endFromApi = parseDate(task.endDate);
        const end = normalizeDate(endFromApi || addDays(start, fallbackDuration));
        const safeEnd = end <= start ? addDays(start, fallbackDuration) : end;

        return {
          ...task,
          assignment: assignments.find((assignment) => assignment.taskID != null && String(assignment.taskID) === task.id),
          start,
          end: safeEnd,
          durationDays: durationFromDates(start, safeEnd),
          offsetDays: 0,
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title));

    if (timelineTasks.length === 0) {
      return { tasks: [], days: [], start: baseStart, totalDays: 0 };
    }

    const minStart = new Date(Math.min(...timelineTasks.map((task) => task.start.getTime())));
    const maxEnd = new Date(Math.max(...timelineTasks.map((task) => task.end.getTime())));
    const start = addDays(normalizeDate(minStart), -2);
    const end = addDays(normalizeDate(maxEnd), 4);
    const totalDays = Math.max(1, diffDays(start, end));
    const days = Array.from({ length: totalDays + 1 }, (_, index) => addDays(start, index));

    return {
      tasks: timelineTasks.map((task) => ({ ...task, offsetDays: diffDays(start, task.start) })),
      days,
      start,
      totalDays,
    };
  }, [assignments, project.createdAt, tasks]);

  const taskById = useMemo(() => {
    return new Map(tasks.map((task) => [task.id, task]));
  }, [tasks]);

  const saveTimelineRange = useCallback(async (
    taskIdValue: string,
    taskTitle: string,
    start: Date,
    end: Date,
    assignedMemberIds: number[],
  ) => {
    const projectId = Number(project.id);
    const taskId = Number(taskIdValue);

    if (!Number.isFinite(projectId) || projectId <= 0 || !Number.isFinite(taskId) || taskId <= 0) return;
    if (!start || !end) {
      toast.error('Start date and end date are required');
      return;
    }
    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    const scheduledStartDate = toDateInputValue(start);
    const scheduledEndDate = toDateInputValue(end);

    setSavingTaskId(taskIdValue);
    setTasks((currentTasks) => {
      const nextTasks = currentTasks.map((task) => (
        task.id === taskIdValue
          ? { ...task, startDate: scheduledStartDate, endDate: scheduledEndDate }
          : task
      ));
      onUpdateProject({ ...project, tasks: nextTasks });
      return nextTasks;
    });

    try {
      await schedulerAPI.manualScheduleTask(projectId, taskId, {
        assignedMemberIds,
        scheduledStartDate,
        scheduledEndDate,
      });
      await refreshTasks();
      toast.success(`${taskTitle} schedule updated`);
    } catch (err: any) {
      console.error('Failed to save Gantt assignment schedule:', err);
      toast.error(err?.message || 'Failed to save Gantt assignment schedule');
      await refreshTasks();
    } finally {
      setSavingTaskId(null);
    }
  }, [onUpdateProject, project, refreshTasks]);

  const getRangeForDrag = useCallback((drag: TimelineDragState, daysDelta: number) => {
    const timelineStart = timeline.start;
    const timelineEnd = addDays(timeline.start, timeline.totalDays);
    const duration = diffDays(drag.originStart, drag.originEnd);
    let previewStart = drag.originStart;
    let previewEnd = drag.originEnd;

    if (drag.mode === 'move') {
      previewStart = addDays(drag.originStart, daysDelta);
      previewEnd = addDays(drag.originEnd, daysDelta);

      if (previewStart < timelineStart) {
        previewStart = timelineStart;
        previewEnd = addDays(previewStart, duration);
      }
      if (previewEnd > timelineEnd) {
        previewEnd = timelineEnd;
        previewStart = addDays(previewEnd, -duration);
      }
    } else if (drag.mode === 'resize-start') {
      previewStart = addDays(drag.originStart, daysDelta);
      if (previewStart < timelineStart) previewStart = timelineStart;
      if (previewStart >= drag.originEnd) previewStart = addDays(drag.originEnd, -1);
      previewEnd = drag.originEnd;
    } else {
      previewEnd = addDays(drag.originEnd, daysDelta);
      if (previewEnd > timelineEnd) previewEnd = timelineEnd;
      if (previewEnd <= drag.originStart) previewEnd = addDays(drag.originStart, 1);
      previewStart = drag.originStart;
    }

    return { previewStart, previewEnd };
  }, [timeline.start, timeline.totalDays]);

  const handleTimelinePointerDown = (
    event: PointerEvent<HTMLDivElement>,
    task: TimelineTask,
    mode: DragMode,
  ) => {
    if (!isManager || savingTaskId === task.id) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    setDragState({
      taskId: task.id,
      taskTitle: task.title,
      mode,
      originClientX: event.clientX,
      originStart: task.start,
      originEnd: task.end,
      previewStart: task.start,
      previewEnd: task.end,
      daysDelta: 0,
      assignedMemberIds: task.assignment?.assignedMemberIds || task.assignedMemberIds || [],
    });
  };

  const handleTimelinePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;

    const daysDelta = Math.round((event.clientX - dragState.originClientX) / minColumnWidth);
    if (daysDelta === dragState.daysDelta) return;

    const { previewStart, previewEnd } = getRangeForDrag(dragState, daysDelta);
    const effectiveDelta = diffDays(dragState.originStart, previewStart);

    setDragState({
      ...dragState,
      previewStart,
      previewEnd,
      daysDelta: dragState.mode === 'resize-end' ? daysDelta : effectiveDelta,
    });
  };

  const handleTimelinePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const completedDrag = dragState;
    setDragState(null);

    const dateChanged =
      toDateInputValue(completedDrag.previewStart) !== toDateInputValue(completedDrag.originStart)
      || toDateInputValue(completedDrag.previewEnd) !== toDateInputValue(completedDrag.originEnd);

    if (!dateChanged) return;

    void saveTimelineRange(
      completedDrag.taskId,
      completedDrag.taskTitle,
      completedDrag.previewStart,
      completedDrag.previewEnd,
      completedDrag.assignedMemberIds,
    );
  };

  const handleTimelinePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  };



  const chartWidth = Math.max(900, (timeline.days.length || 1) * minColumnWidth);
  const rowAreaHeight = Math.max(180, timeline.tasks.length * taskRowHeight);
  const sidebarWidth = 320;
  const ganttContentWidth = sidebarWidth + chartWidth;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Gantt Chart
          </h2>
          <p className="text-sm text-gray-600">
            Task timeline auto-synced from task assignments API{isManager ? ' with live editing.' : '.'}
            {' '}
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isManager && (
            <button
              type="button"
              onClick={() => setShowAddTaskModal(true)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                unassignedTasks.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
              disabled={unassignedTasks.length === 0}
              title={
                unassignedTasks.length > 0
                  ? `Add one of ${unassignedTasks.length} unassigned task(s) to Gantt chart`
                  : 'All tasks are already scheduled'
              }
            >
              <Plus className="w-4 h-4" />
              Add Task ({unassignedTasks.length})
            </button>
          )}
          <button
            type="button"
            onClick={refreshTasks}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            title="Manually refresh Gantt data (auto-refreshes every 30 seconds)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && timeline.tasks.length === 0 ? (
        <div className="h-[55vh] flex flex-col items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span>Fetching Gantt data from task assignments API...</span>
        </div>
      ) : timeline.tasks.length === 0 ? (
        <div className="h-[55vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-gray-400" />
          <div>
            <h3 className="text-gray-900 font-medium">No Gantt Data</h3>
            <p className="text-gray-600 text-sm mt-1">No task assignments were returned by the task assignments API.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-auto">
          <div className="flex" style={{ width: ganttContentWidth }}>
              <div className="sticky left-0 z-20 w-[320px] flex-none bg-gray-50 border-r border-gray-200 shadow-[1px_0_0_rgba(229,231,235,1)]">
                <div className="h-16 px-4 flex items-center border-b border-gray-200">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tasks</div>
                    <div className="text-xs text-gray-500">
                      {timeline.tasks.length} task assignment{timeline.tasks.length === 1 ? '' : 's'} from API
                    </div>
                  </div>
                </div>
                {timeline.tasks.map((task) => {
                  const status = getStatusClasses(task.status);
                  const dependencies = task.dependencies.map((id) => taskById.get(id)).filter(Boolean) as Task[];

                  return (
                    <div key={task.id} className="h-[58px] px-4 border-b border-gray-100 flex items-center gap-3">
                      <div className={`w-2 h-9 rounded-full ${status.bar}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span className={`px-2 py-0.5 rounded-full border ${status.badge}`}>{status.label}</span>
                          <span>{task.durationDays} day{task.durationDays === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      {dependencies.length > 0 && (
                        <span title={`Depends on: ${dependencies.map((dep) => dep.title).join(', ')}`}>
                          <Link2 className="w-4 h-4 text-gray-400" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex-none" style={{ width: chartWidth }}>
                <div className="h-16 border-b border-gray-200 bg-gray-50 grid" style={{ gridTemplateColumns: `repeat(${timeline.days.length}, ${minColumnWidth}px)` }}>
                  {timeline.days.map((day, index) => {
                    const isMonthStart = day.getDate() === 1;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`border-r border-gray-200 px-1 py-2 text-center ${isWeekend ? 'bg-gray-100' : ''}`}
                      >
                        <div className="text-[11px] font-medium text-gray-700">{day.getDate()}</div>
                        <div className="text-[10px] text-gray-500">
                          {isMonthStart || index === 0
                            ? day.toLocaleDateString('en-US', { month: 'short' })
                            : day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="relative" style={{ height: rowAreaHeight }}>
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${timeline.days.length}, ${minColumnWidth}px)` }}>
                    {timeline.days.map((day) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r border-b border-gray-100 ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
                        />
                      );
                    })}
                  </div>

                  {timeline.tasks.map((task, index) => {
                    const status = getStatusClasses(task.status);
                    const draggedRange = dragState?.taskId === task.id
                      ? { start: dragState.previewStart, end: dragState.previewEnd }
                      : { start: task.start, end: task.end };
                    const left = diffDays(timeline.start, draggedRange.start) * minColumnWidth;
                    const width = Math.max(minColumnWidth, durationFromDates(draggedRange.start, draggedRange.end) * minColumnWidth);
                    const top = index * taskRowHeight + 12;
                    const isSaving = savingTaskId === task.id;
                    const isDragging = dragState?.taskId === task.id;
                    const canDrag = isManager && !isSaving;

                    return (
                      <div
                        key={task.id}
                        className={`absolute h-9 rounded-md shadow-sm ${status.bar} text-white group select-none ${canDrag ? 'cursor-grab active:cursor-grabbing touch-none' : ''} ${isDragging ? 'ring-2 ring-blue-300 ring-offset-1 z-10' : ''} ${isSaving ? 'opacity-75' : ''}`}
                        style={{ left, top, width }}
                        title={`${task.title}: ${toDateInputValue(draggedRange.start)} to ${toDateInputValue(draggedRange.end)}`}
                        onPointerDown={(event) => handleTimelinePointerDown(event, task, 'move')}
                        onPointerMove={handleTimelinePointerMove}
                        onPointerUp={handleTimelinePointerUp}
                        onPointerCancel={handleTimelinePointerCancel}
                      >
                        {canDrag && (
                          <div
                            className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-md bg-black/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            role="button"
                            tabIndex={0}
                            title="Drag to change start date"
                            aria-label={`Change start date for ${task.title}`}
                            onPointerDown={(event) => handleTimelinePointerDown(event, task, 'resize-start')}
                            onPointerMove={handleTimelinePointerMove}
                            onPointerUp={handleTimelinePointerUp}
                            onPointerCancel={handleTimelinePointerCancel}
                          />
                        )}
                        <div className="h-full flex items-center justify-between gap-2 px-3 pointer-events-none">
                          <span className="text-xs font-medium truncate">{task.title}</span>
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin flex-none" />
                          ) : isDragging ? (
                            <span className="text-[11px] font-medium flex-none">
                              {toDateInputValue(draggedRange.start)} - {toDateInputValue(draggedRange.end)}
                            </span>
                          ) : null}
                        </div>
                        {canDrag && (
                          <div
                            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-md bg-black/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            role="button"
                            tabIndex={0}
                            title="Drag to change end date"
                            aria-label={`Change end date for ${task.title}`}
                            onPointerDown={(event) => handleTimelinePointerDown(event, task, 'resize-end')}
                            onPointerMove={handleTimelinePointerMove}
                            onPointerUp={handleTimelinePointerUp}
                            onPointerCancel={handleTimelinePointerCancel}
                          />
                        )}
                        {canDrag && !isDragging && (
                          <div className="absolute -top-5 left-0 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[11px] text-white group-hover:block">
                            Drag to move; drag edges to resize
                          </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          {(['todo', 'in-progress', 'review', 'done'] as Task['status'][]).map((statusKey) => {
            const status = getStatusClasses(statusKey);
            return (
              <div key={statusKey} className="flex items-center gap-2 text-gray-600">
                <div className={`w-3 h-3 rounded ${status.bar}`} />
                <span>{status.label}</span>
              </div>
            );
          })}
        </div>
        <div className="text-gray-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Real-time API sync • Auto-refresh every 30s
        </div>
      </div>

      <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Task to Gantt Chart</DialogTitle>
            <DialogDescription>
              Select an unscheduled task and provide start/end dates to manually schedule it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-select" className="text-base font-medium mb-2 block">
                Select Task
              </Label>
              <Select
                value={addTaskFormData.selectedTaskId}
                onValueChange={(value: string) =>
                  setAddTaskFormData({ ...addTaskFormData, selectedTaskId: value })
                }
              >
                <SelectTrigger id="task-select">
                  <SelectValue placeholder="Choose a task..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedTasksLoading ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading unassigned tasks...
                    </div>
                  ) : unassignedTasksError ? (
                    <div className="px-2 py-1.5 text-sm text-red-500">
                      Error: {unassignedTasksError}
                    </div>
                  ) : unassignedTasks.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No unassigned tasks available
                    </div>
                  ) : (
                    unassignedTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date" className="text-base font-medium mb-2 block">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={addTaskFormData.startDate}
                onChange={(e) =>
                  setAddTaskFormData({ ...addTaskFormData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-base font-medium mb-2 block">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={addTaskFormData.endDate}
                onChange={(e) =>
                  setAddTaskFormData({ ...addTaskFormData, endDate: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setAddTaskFormData({
                    selectedTaskId: '',
                    startDate: '',
                    endDate: '',
                    assignedMemberIds: [],
                  });
                }}
                disabled={addingTaskId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTaskSubmit}
                disabled={addingTaskId !== null || !addTaskFormData.selectedTaskId}
                className="flex items-center gap-2"
              >
                {addingTaskId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Gantt
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
