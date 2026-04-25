import { useState } from 'react';
import { Project, TeamMember } from '../App';
import { Users, Plus, Edit2, Trash2, Award, X } from 'lucide-react';
import { TeamMemberModal } from './team-member-modal';

interface ResourceManagementProps {
  project: Project;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

export function ResourceManagement({ project, isManager, onUpdateProject }: ResourceManagementProps) {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editSkillValue, setEditSkillValue] = useState('');

  const handleSaveMember = (member: TeamMember) => {
    let updatedMembers: TeamMember[];
    
    if (editingMember) {
      updatedMembers = project.teamMembers.map(m => m.id === member.id ? member : m);
    } else {
      updatedMembers = [...project.teamMembers, member];
    }

    onUpdateProject({ ...project, teamMembers: updatedMembers });
    setShowMemberModal(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    const updatedMembers = project.teamMembers.filter(m => m.id !== memberId);
    onUpdateProject({ ...project, teamMembers: updatedMembers });
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };

  // Skills Management
  const handleAddSkill = () => {
    if (newSkill.trim() && !project.registeredSkills.includes(newSkill.trim())) {
      onUpdateProject({
        ...project,
        registeredSkills: [...project.registeredSkills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleDeleteSkill = (skill: string) => {
    // Check if any team member has this skill
    const membersWithSkill = project.teamMembers.filter(m => m.skills.includes(skill));
    if (membersWithSkill.length > 0) {
      if (!confirm(`${membersWithSkill.length} team member(s) have this skill. Remove it anyway?`)) {
        return;
      }
      // Remove skill from all team members
      const updatedMembers = project.teamMembers.map(m => ({
        ...m,
        skills: m.skills.filter(s => s !== skill),
      }));
      onUpdateProject({
        ...project,
        teamMembers: updatedMembers,
        registeredSkills: project.registeredSkills.filter(s => s !== skill),
      });
    } else {
      onUpdateProject({
        ...project,
        registeredSkills: project.registeredSkills.filter(s => s !== skill),
      });
    }
  };

  const handleEditSkill = (oldSkill: string) => {
    setEditingSkill(oldSkill);
    setEditSkillValue(oldSkill);
  };

  const handleSaveEditSkill = () => {
    if (editingSkill && editSkillValue.trim() && editSkillValue !== editingSkill) {
      // Update skill name in registered skills
      const updatedSkills = project.registeredSkills.map(s => 
        s === editingSkill ? editSkillValue.trim() : s
      );
      
      // Update skill name in all team members
      const updatedMembers = project.teamMembers.map(m => ({
        ...m,
        skills: m.skills.map(s => s === editingSkill ? editSkillValue.trim() : s),
      }));

      onUpdateProject({
        ...project,
        registeredSkills: updatedSkills,
        teamMembers: updatedMembers,
      });
    }
    setEditingSkill(null);
    setEditSkillValue('');
  };

  const handleCancelEditSkill = () => {
    setEditingSkill(null);
    setEditSkillValue('');
  };

  // Calculate skill coverage
  const skillCoverage = project.registeredSkills.map(skill => {
    const membersWithSkill = project.teamMembers.filter(m => m.skills.includes(skill));
    return { skill, memberCount: membersWithSkill.length };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6" />
          <h2>Resource Management</h2>
        </div>
        <p className="text-purple-100">
          Register skills for your project and manage team member invitations
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Team Members</span>
          </div>
          <div className="text-gray-900">{project.teamMembers.length} members</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Registered Skills</span>
          </div>
          <div className="text-gray-900">{project.registeredSkills.length} skills</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Skills Coverage</span>
          </div>
          <div className="text-gray-900">
            {project.registeredSkills.length > 0
              ? Math.round((skillCoverage.filter(s => s.memberCount > 0).length / project.registeredSkills.length) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Skills Management Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900 mb-1">Registered Skills</h3>
            <p className="text-sm text-gray-600">
              Define skills that team members can choose from when joining the project
            </p>
          </div>
        </div>

        {/* Add Skill */}
        {isManager && (
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add a new skill (e.g., React, UI/UX Design)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>
          </div>
        )}

        {/* Skills List */}
        {project.registeredSkills.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">No skills registered yet</p>
            {isManager && (
              <p className="text-sm text-gray-500">
                Add skills that team members can choose from when joining the project
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {skillCoverage.map(({ skill, memberCount }) => (
              <div
                key={skill}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                {editingSkill === skill ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editSkillValue}
                      onChange={(e) => setEditSkillValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEditSkill();
                        if (e.key === 'Escape') handleCancelEditSkill();
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEditSkill}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEditSkill}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-900">{skill}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {isManager && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          title="Edit skill"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete skill"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900 mb-1">Team Members</h3>
            <p className="text-sm text-gray-600">
              Invite team members by email. They can then enroll and select their skills.
            </p>
          </div>
          {isManager && (
            <button
              onClick={() => {
                setEditingMember(null);
                setShowMemberModal(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>
        
        {project.teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">No team members yet</p>
            {isManager && (
              <button
                onClick={() => {
                  setEditingMember(null);
                  setShowMemberModal(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Invite Your First Member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {project.teamMembers.map(member => (
              <div
                key={member.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-700">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>

                    <div className="ml-13">
                      <div className="text-sm text-gray-600 mb-1">
                        Role: {member.role}
                      </div>
                      {member.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No skills selected yet
                        </div>
                      )}
                    </div>
                  </div>

                  {isManager && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${member.name} from the project?`)) {
                            handleDeleteMember(member.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showMemberModal && (
        <TeamMemberModal
          member={editingMember}
          project={project}
          isManager={isManager}
          onSave={handleSaveMember}
          onClose={() => {
            setShowMemberModal(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}
