import { User, Project } from '../App';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, Users, Briefcase, Mail, Calendar } from 'lucide-react';
import { useState, useMemo } from 'react';

interface BrowseProjectsPageProps {
  currentUser: User;
  projects: Project[];
  onEnrollProject: (projectId: string) => void;
}

export default function BrowseProjectsPage({
  currentUser,
  projects,
  onEnrollProject,
}: BrowseProjectsPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'active' | 'on-hold' | 'completed'>('all');

  // Filter projects user is not already a member of
  const availableProjects = useMemo(() => {
    return projects.filter((project) => {
      const isMember = project.members.includes(currentUser.email);
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return !isMember && matchesSearch && matchesStatus;
    });
  }, [projects, currentUser.email, searchQuery, statusFilter]);

  const handleEnroll = (projectId: string) => {
    onEnrollProject(projectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
            <h1 className="text-gray-900">Browse Projects</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setStatusFilter('planning')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'planning'
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Planning
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('on-hold')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'on-hold'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              On Hold
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {availableProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No projects available to join</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery ? 'Try adjusting your search criteria' : 'Check back later for new projects'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProjects.map((project) => {
              const manager = projects.find(p => p.id === project.id)?.manager;
              const isInvited = project.teamMembers.some(tm => tm.email === currentUser.email);

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-gray-900 flex-1">{project.name}</h3>
                      <span className={`px-2 py-1 rounded-md text-xs border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{project.members.length} members</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{project.tasks.length} tasks</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {isInvited && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">You're invited!</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleEnroll(project.id)}
                      className={`w-full px-4 py-2 rounded-lg transition-colors ${
                        isInvited
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isInvited ? 'Accept Invitation' : 'Join Project'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
