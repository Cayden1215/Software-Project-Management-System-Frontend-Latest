import { useState } from 'react';
import { User, Project } from '../App';
import { Folder, Users, Calendar, Plus, Trash2, Edit2, LogOut, X, User as UserIcon, Settings, Compass, Bell, Info } from 'lucide-react';
import { useNavigate } from 'react-router';

interface ProjectListProps {
  projects: Project[];
  currentUser: User;
  onSelectProject: (project: Project) => void;
  onEnrollProject: (projectId: string) => void;
  onCreateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onLogout: () => void;
}

export function ProjectList({ 
  projects, 
  currentUser, 
  onSelectProject, 
  onEnrollProject,
  onCreateProject,
  onDeleteProject,
  onLogout 
}: ProjectListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  
  const isManager = currentUser.role === 'manager';
  
  // For managers: only show their own projects
  // For members: show enrolled and invited projects
  const myProjects = isManager 
    ? projects.filter(p => p.manager === currentUser.email)
    : projects.filter(p => p.members.includes(currentUser.email));
  
  // Find projects where user is invited via email (only for members)
  const invitedProjects = !isManager 
    ? projects.filter(p => 
        !p.members.includes(currentUser.email) && 
        p.teamMembers.some(tm => tm.email === currentUser.email && (!tm.name || tm.name === ''))
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Project Management System</h1>
            <p className="text-gray-600">
              Welcome, {currentUser.name}
              <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                isManager ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {isManager ? 'Project Manager' : 'Team Member'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation Menu */}
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => navigate('/about')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="About"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* My Projects */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900">
              {isManager ? 'My Projects' : 'Enrolled Projects'}
            </h2>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
          
          {myProjects.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                {isManager 
                  ? "You haven't created any projects yet"
                  : "You haven't enrolled in any projects yet"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUser={currentUser}
                  isManager={isManager}
                  onSelect={() => onSelectProject(project)}
                  onDelete={isManager ? () => onDeleteProject(project.id) : undefined}
                  enrolled
                />
              ))}
            </div>
          )}
        </div>

        {/* Invited Projects (only for members) */}
        {!isManager && invitedProjects.length > 0 && (
          <div className="mb-12">
            <h2 className="text-gray-900 mb-4">Invited Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUser={currentUser}
                  isManager={false}
                  onEnroll={() => onEnrollProject(project.id)}
                  enrolled={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          currentUser={currentUser}
          onCreateProject={onCreateProject}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  currentUser: User;
  isManager: boolean;
  onSelect?: () => void;
  onEnroll?: () => void;
  onDelete?: () => void;
  enrolled: boolean;
}

function ProjectCard({ project, currentUser, isManager, onSelect, onEnroll, onDelete, enrolled }: ProjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalTasks = project.tasks.length;

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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div 
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer relative"
      onClick={enrolled ? onSelect : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-gray-900 mb-2">{project.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
            {isManager && project.manager === currentUser.id && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                Manager
              </span>
            )}
          </div>
        </div>
        {isManager && onDelete && (
          <button
            onClick={handleDeleteClick}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{project.members.length} members</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {enrolled ? (
        <button 
          onClick={onSelect}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Project
        </button>
      ) : (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEnroll && onEnroll();
          }}
          className="w-full px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Accept Invitation
        </button>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex flex-col items-center justify-center p-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-12 h-12 text-red-600 mb-3" />
          <p className="text-gray-900 mb-2 text-center">Delete this project?</p>
          <p className="text-sm text-gray-600 mb-4 text-center">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateProjectModalProps {
  currentUser: User;
  onCreateProject: (project: Project) => void;
  onClose: () => void;
}

function CreateProjectModal({ currentUser, onCreateProject, onClose }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      manager: currentUser.email,
      members: [currentUser.email],
      teamMembers: [],
      registeredSkills: [],
      tasks: [],
      sprints: [],
      createdAt: new Date().toISOString().split('T')[0],
      status: formData.status,
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900">Create New Project</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-gray-700 mb-2">Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-gray-700 mb-2">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}