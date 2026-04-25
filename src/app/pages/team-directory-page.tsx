import { User, Project, TeamMember } from '../App';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, Users, Mail, Briefcase, Award } from 'lucide-react';
import { useState, useMemo } from 'react';

interface TeamDirectoryPageProps {
  currentUser: User;
  projects: Project[];
}

export default function TeamDirectoryPage({ currentUser, projects }: TeamDirectoryPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all unique team members from all projects
  const allTeamMembers = useMemo(() => {
    const memberMap = new Map<string, TeamMember & { projectCount: number; projectNames: string[] }>();

    projects.forEach((project) => {
      project.teamMembers.forEach((member) => {
        if (member.email && member.name) {
          const existing = memberMap.get(member.email);
          if (existing) {
            existing.projectCount++;
            existing.projectNames.push(project.name);
            // Merge skills
            member.skills.forEach(skill => {
              if (!existing.skills.includes(skill)) {
                existing.skills.push(skill);
              }
            });
          } else {
            memberMap.set(member.email, {
              ...member,
              projectCount: 1,
              projectNames: [project.name],
            });
          }
        }
      });
    });

    return Array.from(memberMap.values()).filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [projects, searchQuery]);

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
            <h1 className="text-gray-900">Team Directory</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, role, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Team Members</div>
                <div className="text-gray-900 mt-1">{allTeamMembers.length}</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Projects</div>
                <div className="text-gray-900 mt-1">{projects.filter(p => p.status === 'active').length}</div>
              </div>
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Unique Skills</div>
                <div className="text-gray-900 mt-1">
                  {new Set(allTeamMembers.flatMap(m => m.skills)).size}
                </div>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        {allTeamMembers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No team members found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery ? 'Try adjusting your search criteria' : 'Team members will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTeamMembers.map((member) => {
              const isCurrentUser = member.email === currentUser.email;
              
              return (
                <div
                  key={member.email}
                  className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                    isCurrentUser ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-gray-900 flex items-center gap-2">
                            {member.name}
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                You
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{member.role || 'Team Member'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{member.projectCount} project{member.projectCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {member.skills && member.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-600 mb-2">Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs border border-gray-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs border border-gray-200">
                              +{member.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {member.projectNames && member.projectNames.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 mb-2">Projects:</div>
                        <div className="text-sm text-gray-700">
                          {member.projectNames.slice(0, 2).join(', ')}
                          {member.projectNames.length > 2 && ` +${member.projectNames.length - 2} more`}
                        </div>
                      </div>
                    )}
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
