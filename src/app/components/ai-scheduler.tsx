import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Zap, Loader2 } from 'lucide-react';
import { schedulerAPI } from '../services/api-client';
import { toast } from 'sonner';
import { Project } from '../App';

interface AISchedulerProps {
  project: Project;
  onScheduleComplete: () => void;
  onClose: () => void;
}

export function AIScheduler({ project, onScheduleComplete, onClose }: AISchedulerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = async () => {
    setIsGenerating(true);
    setError(null);
    setResultMessage(null);

    try {
      // Call backend AI scheduler API
      const result = await schedulerAPI.runAIScheduler(parseInt(project.id));

      setResultMessage(result);
      toast.success('Schedule generated successfully!');

      // Call parent to refresh the data
      onScheduleComplete();
    } catch (err: any) {
      console.error('AI Scheduler error:', err);
      const errorMessage = err.message || 'Failed to generate schedule';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
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

      {/* Generate Button */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <button
          onClick={generateSchedule}
          disabled={isGenerating}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running AI Scheduler...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Generate Optimized Schedule
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {resultMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-green-900 mb-2">Scheduling Complete!</h3>
              <p className="text-green-700 text-sm">{resultMessage}</p>
              <p className="text-green-600 text-sm mt-2">
                All tasks have been scheduled with optimal dates and assigned to team members. You can now view the updated timeline and assign tasks to sprints.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Close & View Schedule
          </button>
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
