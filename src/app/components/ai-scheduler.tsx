import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Zap, Loader2, CalendarDays, Users } from 'lucide-react';
import { schedulerAPI, type TaskAssignmentDto } from '../services/api-client';
import { toast } from 'sonner';
import { Project } from '../App';

interface AISchedulerProps {
  project: Project;
  onScheduleComplete: () => void;
  onClose: () => void;
}

export function AIScheduler({ project, onScheduleComplete, onClose }: AISchedulerProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewAssignments, setPreviewAssignments] = useState<TaskAssignmentDto[] | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value?: string) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const previewSchedule = async () => {
    setIsPreviewing(true);
    setError(null);
    setApplyMessage(null);
    setPreviewAssignments(null);

    try {
      const result = await schedulerAPI.previewSchedule(parseInt(project.id));
      setPreviewAssignments(result);
      toast.success('Schedule preview loaded');
    } catch (err: any) {
      console.error('Schedule preview error:', err);
      const errorMessage = err.message || 'Failed to preview schedule';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPreviewing(false);
    }
  };

  const applySchedule = async () => {
    setIsApplying(true);
    setError(null);
    setApplyMessage(null);

    try {
      const result = await schedulerAPI.runAIScheduler(parseInt(project.id));
      setApplyMessage(result || 'Schedule applied successfully.');
      toast.success('Schedule applied successfully');
      onScheduleComplete();
    } catch (err: any) {
      console.error('Schedule apply error:', err);
      const errorMessage = err.message || 'Failed to apply schedule';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2>AI-Powered Scheduler</h2>
        </div>
        <p className="text-blue-100">
          Generate an optimized project schedule based on task dependencies, team member skills, and availability
        </p>
      </div>

      {/* Info Panel */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-gray-900 mb-4">How It Works</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            Analyzes all registered tasks and their dependencies
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            Matches tasks to team members based on required skills
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            Calculates optimal start and end dates for each task
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            Balances workload across team members
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            Respects task dependencies (prerequisite tasks must complete first)
          </li>
        </ul>
      </div>

      {/* Preview Button */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <button
          onClick={previewSchedule}
          disabled={isPreviewing}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPreviewing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Schedule Preview...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Preview Schedule
            </>
          )}
        </button>
      </div>

      {/* Preview Results */}
      {previewAssignments && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-gray-900 mb-1">Schedule Preview</h3>
              <p className="text-gray-600 text-sm">
                {previewAssignments.length === 0
                  ? 'No scheduled tasks were returned.'
                  : `${previewAssignments.length} scheduled task${previewAssignments.length === 1 ? '' : 's'} returned.`}
              </p>
            </div>
          </div>
          {previewAssignments.length > 0 && (
            <div className="divide-y divide-gray-200">
              {previewAssignments.map((assignment, index) => (
                <div key={`${assignment.assignmentID ?? 'preview'}-${assignment.taskID ?? index}`} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-gray-900">{assignment.taskName || 'Untitled Task'}</h4>
                      <p className="text-sm text-gray-500">
                        Task ID {assignment.taskID ?? 'N/A'} · Assignment {assignment.assignmentID ?? 'Preview only'}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      Project {assignment.projectID ?? project.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {formatDate(assignment.scheduledStartDate)} - {formatDate(assignment.scheduledEndDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {assignment.requiredMemberNum ?? 0} required
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(assignment.assignedMemberNames || []).length > 0 ? (
                      assignment.assignedMemberNames?.map((name, memberIndex) => (
                        <span key={`${name}-${memberIndex}`} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">Unassigned</span>
                    )}
                    
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-6 border-t border-gray-200 space-y-3">
            {applyMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 text-sm">{applyMessage}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={applySchedule}
                disabled={isApplying || isPreviewing || previewAssignments.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying Schedule...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Apply Schedule
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isApplying}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-900 mb-2">Scheduling Failed</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                Please ensure all tasks have required skills defined and team members have the necessary skills assigned.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
