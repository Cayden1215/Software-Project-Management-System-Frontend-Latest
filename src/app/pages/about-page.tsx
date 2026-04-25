import { useNavigate } from 'react-router';
import { ArrowLeft, Rocket, CheckCircle, Users, Zap, Shield, BarChart } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-gray-900">About</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-gray-900 mb-4">Project Management System</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A comprehensive project management platform designed to help teams collaborate effectively,
            manage tasks efficiently, and deliver projects on time.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Task Management</h3>
                <p className="text-sm text-gray-600">
                  Organize tasks with Kanban boards, Gantt charts, and sprint planning. Track progress
                  with real-time updates and dependencies.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-sm text-gray-600">
                  Invite team members, assign tasks based on skills, and track individual contributions
                  across multiple projects.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">AI Scheduler</h3>
                <p className="text-sm text-gray-600">
                  Leverage AI-powered scheduling to automatically optimize project timelines based on
                  task dependencies and team capacity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Timeline Visualization</h3>
                <p className="text-sm text-gray-600">
                  Visualize project timelines with Gantt-style charts, track milestones, and identify
                  critical paths with dependency arrows.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Role-Based Access</h3>
                <p className="text-sm text-gray-600">
                  Control access with role-based permissions. Project managers can manage all aspects
                  while team members focus on their assigned tasks.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Scrum Support</h3>
                <p className="text-sm text-gray-600">
                  Built-in Scrum board with sprint management, story points, and backlog prioritization
                  for agile teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Version 1.0.0</p>
          <p className="text-sm text-gray-500">
            Built with React, TypeScript, and Tailwind CSS
          </p>
          <p className="text-xs text-gray-400 mt-4">
            © 2026 Project Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
