import { useState } from 'react';
import { Project, User } from '../App';
import { ArrowLeft, LayoutGrid, Calendar, Users, ClipboardList, User as UserIcon, Edit2 } from 'lucide-react';
import { ScrumKanbanBoard } from './scrum-kanban-board';
import { TimelineView } from './timeline-view';
import { ResourceManagement } from './resource-management';
import { TaskManagement } from './task-management';
import { TeamMemberProfile } from './team-member-profile';

interface ProjectWorkspaceProps {
  project: Project;
  currentUser: User;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
}

type ViewType = 'tasks' | 'kanban' | 'timeline' | 'resources' | 'profile';

export function ProjectWorkspace({ project, currentUser, isManager, onUpdateProject, onBack }: ProjectWorkspaceProps) {
  const [activeView, setActiveView] = useState<ViewType>(isManager ? 'tasks' : 'kanban');
  const [showStatusEdit, setShowStatusEdit] = useState(false);

  const handleStatusChange = (status: Project['status']) => {
    onUpdateProject({ ...project, status });
    setShowStatusEdit(false);
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'planning':
        return 'bg-blue-100 text-blue-700';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'planning':
        return 'Planning';
      case 'on-hold':
        return 'On Hold';
      case 'completed':
        return 'Completed';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900">{project.name}</h1>
              <p className="text-gray-600 text-sm">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => isManager && setShowStatusEdit(!showStatusEdit)}
                  className={`px-3 py-1 rounded-lg flex items-center gap-2 ${getStatusColor(project.status)} ${
                    isManager ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  }`}
                  disabled={!isManager}
                >
                  {getStatusLabel(project.status)}
                  {isManager && <Edit2 className="w-3 h-3" />}
                </button>
                
                {/* Status Edit Dropdown */}
                {showStatusEdit && isManager && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="p-2">
                      {(['planning', 'active', 'on-hold', 'completed'] as Project['status'][]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${getStatusColor(status)}`}
                        >
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {isManager && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">
                  Project Manager
                </span>
              )}
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('tasks')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeView === 'tasks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Task Management
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeView === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban Board
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeView === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
            {isManager && (
              <button
                onClick={() => setActiveView('resources')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeView === 'resources'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Resource Management
              </button>
            )}
            {!isManager && (
              <button
                onClick={() => setActiveView('profile')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeView === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                My Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeView === 'tasks' && (
          <TaskManagement
            project={project}
            isManager={isManager}
            onUpdateProject={onUpdateProject}
          />
        )}
        {activeView === 'kanban' && (
          <ScrumKanbanBoard
            project={project}
            currentUser={currentUser}
            isManager={isManager}
            onUpdateProject={onUpdateProject}
          />
        )}
        {activeView === 'timeline' && (
          <TimelineView
            project={project}
            isManager={isManager}
            onUpdateProject={onUpdateProject}
          />
        )}
        {activeView === 'resources' && isManager && (
          <ResourceManagement
            project={project}
            isManager={isManager}
            onUpdateProject={onUpdateProject}
          />
        )}
        {activeView === 'profile' && !isManager && (
          <TeamMemberProfile
            project={project}
            currentUser={currentUser}
            onUpdateProject={onUpdateProject}
          />
        )}
      </div>
    </div>
  );
}