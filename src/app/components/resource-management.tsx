import { useEffect, useMemo, useState } from 'react';
import { Project, TeamMember } from '../App';
import { Users, Plus, Edit2, Trash2, Award } from 'lucide-react';
import { TeamMemberModal } from './team-member-modal';
import { projectAPI, projectMemberSkillAPI, skillAPI } from '../services/api-client';
import { toast } from 'sonner';

interface ResourceManagementProps {
  project: Project;
  isManager: boolean;
  onUpdateProject: (project: Project) => void;
}

export function ResourceManagement({ project, isManager, onUpdateProject }: ResourceManagementProps) {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [skillIdByName, setSkillIdByName] = useState<Record<string, number>>({});

  const projectId = useMemo(() => Number(project.id), [project.id]);

  const refreshSkills = async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    const skillDtos = await skillAPI.getProjectSkills(projectId);
    const names = Array.from(new Set(skillDtos.map((s) => s.skillName).filter(Boolean))).sort();
    const idMap: Record<string, number> = {};
    for (const s of skillDtos) {
      if (s.skillName && typeof s.skillID === 'number') {
        idMap[s.skillName] = s.skillID;
      }
    }
    setSkillIdByName(idMap);
    onUpdateProject({ ...project, registeredSkills: names });
  };

  const refreshTeamMembers = async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    const memberDtos = await projectAPI.getProjectTeamMembers(projectId);
    const members: TeamMember[] = memberDtos.map((m) => ({
      id: (m.projectMemberID ?? m.teamMemberID ?? '').toString(),
      name: m.teamMemberUsername || m.teamMemberEmail || 'Team Member',
      email: m.teamMemberEmail || '',
      role: m.projectRole || 'member',
      skills: (m.skills || []).map((s) => s.skillName).filter(Boolean),
    }));
    onUpdateProject({
      ...project,
      teamMembers: members,
      members: members.map((m) => m.email).filter(Boolean),
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshSkills();
        await refreshTeamMembers();
      } catch (e) {
        console.error('Failed to refresh resources:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleSaveMember = async (member: TeamMember) => {
    if (isManager && !editingMember) {
      if (!member.email) return;
      try {
        setIsBusy(true);
        await projectAPI.enrollTeamMember(projectId, {
          projectID: projectId,
          teamMemberEmail: member.email,
          projectRole: member.role,
        });
        toast.success('Invitation sent');
        await refreshTeamMembers();
        setShowMemberModal(false);
        setEditingMember(null);
      } catch (e) {
        console.error('Failed to invite team member:', e);
        toast.error('Failed to invite team member');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const projectMemberId = Number(member.id);
    if (!Number.isFinite(projectMemberId) || projectMemberId <= 0) {
      toast.error('Unable to update team member (invalid member id)');
      return;
    }

    try {
      setIsBusy(true);
      const skillDtos = await skillAPI.getProjectSkills(projectId);
      const idMap: Record<string, number> = {};
      for (const s of skillDtos) {
        if (s.skillName && typeof s.skillID === 'number') {
          idMap[s.skillName] = s.skillID;
        }
      }

      const skillIDs = (member.skills || [])
        .map((name) => idMap[name])
        .filter((id): id is number => Number.isFinite(id));

      try {
        await projectMemberSkillAPI.updateProjectMemberSkills(projectId, projectMemberId, {
          projectMemberID: projectMemberId,
          skillIDs,
        });
      } catch (e) {
        await projectMemberSkillAPI.addSkillsToProjectMember(projectId, {
          projectMemberID: projectMemberId,
          skillIDs,
        });
      }

      toast.success('Team member updated');
      await refreshTeamMembers();
      setShowMemberModal(false);
      setEditingMember(null);
    } catch (e) {
      console.error('Failed to update team member:', e);
      toast.error('Failed to update team member');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const idNum = Number(memberId);
    if (!Number.isFinite(idNum)) {
      toast.error('Unable to remove member (invalid member id)');
      return;
    }

    try {
      setIsBusy(true);
      await projectAPI.removeProjectTeamMember(projectId, idNum);
      toast.success('Team member removed');
      await refreshTeamMembers();
    } catch (e) {
      console.error('Failed to remove team member:', e);
      toast.error('Failed to remove team member');
    } finally {
      setIsBusy(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };

  // Skills Management
  const handleAddSkill = async () => {
    const name = newSkill.trim();
    if (!name) return;
    if (project.registeredSkills.includes(name)) return;

    try {
      setIsBusy(true);
      await skillAPI.createSkill(projectId, { projectID: projectId, skillName: name });
      toast.success('Skill created');
      setNewSkill('');
      await refreshSkills();
    } catch (e) {
      console.error('Failed to create skill:', e);
      toast.error('Failed to create skill');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteSkill = async (skill: string) => {
    // Check if any team member has this skill
    const membersWithSkill = project.teamMembers.filter(m => m.skills.includes(skill));
    if (membersWithSkill.length > 0) {
      if (!confirm(`${membersWithSkill.length} team member(s) have this skill. Remove it anyway?`)) {
        return;
      }
    }

    try {
      setIsBusy(true);
      const knownId = skillIdByName[skill];
      if (typeof knownId !== 'number') {
        await refreshSkills();
      }
      const skillId = skillIdByName[skill];
      if (typeof skillId !== 'number') {
        throw new Error(`Skill ID not found for "${skill}"`);
      }
      await skillAPI.deleteSkill(projectId, skillId);
      toast.success('Skill deleted');
      await refreshSkills();
    } catch (e) {
      console.error('Failed to delete skill:', e);
      toast.error('Failed to delete skill');
    } finally {
      setIsBusy(false);
    }
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add a new skill (e.g., React, UI/UX Design)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isBusy}
              />
              <button
                onClick={handleAddSkill}
                disabled={isBusy}
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
                        onClick={() => handleDeleteSkill(skill)}
                        disabled={isBusy}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
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
                        disabled={isBusy}
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
                        disabled={isBusy}
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
