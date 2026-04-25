import { useState, useEffect } from 'react';
import { User } from '../App';
import { Folder, Users, Calendar, Plus, Trash2, LogOut, X, Settings, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { projectAPI, ProjectDto } from '../services/api-client';
import { toast } from 'sonner';

interface ProjectListProps {
  currentUser: User;
  onLogout: () => void;
}

export function ProjectList({
  currentUser,
  onLogout
}: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const isManager = currentUser.role === 'manager';

  // Fetch projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const fetchedProjects = await projectAPI.getAllProjects();
      setProjects(fetchedProjects);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: Omit<ProjectDto, 'projectID'>) => {
    try {
      const newProject = await projectAPI.createProject(projectData);
      setProjects([...projects, newProject]);
      setShowCreateModal(false);
      toast.success('Project created successfully!');
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await projectAPI.deleteProject(projectId);
      setProjects(projects.filter(p => p.projectID !== projectId));
      toast.success('Project deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleSelectProject = (project: ProjectDto) => {
    navigate(`/projects/${project.projectID}`);
  };

  // For managers: show projects they manage
  // For members: show all projects (they'll need to enroll via project manager)
  const myProjects = projects;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

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
              {isManager ? 'My Projects' : 'Available Projects'}
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
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {isManager ? 'No projects created yet' : 'No projects available'}
              </p>
              <p className="text-sm text-gray-500">
                {isManager
                  ? 'Create your first project to get started'
                  : 'Contact a project manager to be invited to a project'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map(project => (
                <ProjectCard
                  key={project.projectID}
                  project={project}
                  currentUser={currentUser}
                  isManager={isManager}
                  onSelect={() => handleSelectProject(project)}
                  onDelete={isManager ? () => handleDeleteProject(project.projectID!) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
}

// Project Card Component
interface ProjectCardProps {
  project: ProjectDto;
  currentUser: User;
  isManager: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

function ProjectCard({ project, currentUser, isManager, onSelect, onDelete }: ProjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete && onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer relative"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-gray-900 mb-2">{project.projectName}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(project.projectStatus)}`}>
              {project.projectStatus}
            </span>
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

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.projectDescription}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      <button
        onClick={onSelect}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Open Project
      </button>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <p className="text-gray-900 mb-4">Delete this project?</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Project Modal Component
interface CreateProjectModalProps {
  currentUser: User;
  onClose: () => void;
  onCreate: (project: Omit<ProjectDto, 'projectID'>) => void;
}

function CreateProjectModal({ currentUser, onClose, onCreate }: CreateProjectModalProps) {
  const [projectData, setProjectData] = useState({
    projectName: '',
    projectDescription: '',
    startDate: '',
    deadline: '',
    projectStatus: 'planning' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectData.projectName || !projectData.startDate || !projectData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    onCreate({
      ...projectData,
      projectManagerID: parseInt(currentUser.id),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Project Name *</label>
            <input
              type="text"
              value={projectData.projectName}
              onChange={(e) => setProjectData({ ...projectData, projectName: e.target.value })}
              placeholder="Enter project name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Description</label>
            <textarea
              value={projectData.projectDescription}
              onChange={(e) => setProjectData({ ...projectData, projectDescription: e.target.value })}
              placeholder="Describe your project"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={projectData.startDate}
                onChange={(e) => setProjectData({ ...projectData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Deadline *</label>
              <input
                type="date"
                value={projectData.deadline}
                onChange={(e) => setProjectData({ ...projectData, deadline: e.target.value })}
                min={projectData.startDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Status</label>
            <select
              value={projectData.projectStatus}
              onChange={(e) => setProjectData({ ...projectData, projectStatus: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
