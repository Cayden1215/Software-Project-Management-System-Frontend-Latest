import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Link2, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { Project, Task } from '../App';
import { schedulerAPI, taskAssignmentAPI, type TaskAssignmentDto } from '../services/api-client';
import { toast } from 'sonner';

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
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftEndDate, setDraftEndDate] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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

  // Initial fetch on component mount
  useEffect(() => {
    refreshTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Set up real-time polling - refresh every 30 seconds
  useEffect(() => {
    const projectId = Number(project.id);
    if (!Number.isFinite(projectId) || projectId <= 0) return;

    const pollingInterval = setInterval(() => {
      refreshTasks();
    }, 30000); // 30 seconds polling interval

    return () => clearInterval(pollingInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

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

  const openEditDialog = (task: TimelineTask) => {
    setEditingTask(task);
    setDraftStartDate(toDateInputValue(task.start));
    setDraftEndDate(toDateInputValue(task.end));
  };

  const handleSaveTimeline = async () => {
    if (!editingTask) return;

    const projectId = Number(project.id);
    const taskId = Number(editingTask.id);
    const start = parseDate(draftStartDate);
    const end = parseDate(draftEndDate);

    if (!Number.isFinite(projectId) || projectId <= 0 || !Number.isFinite(taskId) || taskId <= 0) return;
    if (!start || !end) {
      toast.error('Start date and end date are required');
      return;
    }
    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    setSavingTaskId(editingTask.id);
    try {
      await schedulerAPI.manualScheduleTask(projectId, taskId, {
        assignedMemberIds: editingTask.assignment?.assignedMemberIds || editingTask.assignedMemberIds || [],
        scheduledStartDate: draftStartDate,
        scheduledEndDate: draftEndDate,
      });
      await refreshTasks();
      setEditingTask(null);
      toast.success('Gantt assignment schedule updated');
    } catch (err: any) {
      console.error('Failed to save Gantt assignment schedule:', err);
      toast.error(err?.message || 'Failed to save Gantt assignment schedule');
    } finally {
      setSavingTaskId(null);
    }
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
                    const left = task.offsetDays * minColumnWidth;
                    const width = Math.max(minColumnWidth, task.durationDays * minColumnWidth);
                    const top = index * taskRowHeight + 12;
                    const isSaving = savingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`absolute h-9 rounded-md shadow-sm ${status.bar} text-white group`}
                        style={{ left, top, width }}
                        title={`${task.title}: ${toDateInputValue(task.start)} to ${toDateInputValue(task.end)}`}
                      >
                        <div className="h-full flex items-center justify-between gap-2 px-3">
                          <span className="text-xs font-medium truncate">{task.title}</span>
                          {isManager && (
                            <button
                              type="button"
                              onClick={() => openEditDialog(task)}
                              disabled={isSaving}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-white/20 disabled:opacity-50"
                              title="Edit dates"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
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

      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 font-semibold">Edit Gantt Dates</h3>
                <p className="text-sm text-gray-500 truncate max-w-[320px]">{editingTask.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(event) => setDraftStartDate(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={draftEndDate}
                  min={draftStartDate}
                  onChange={(event) => setDraftEndDate(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTimeline}
                disabled={savingTaskId === editingTask.id}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingTaskId === editingTask.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
