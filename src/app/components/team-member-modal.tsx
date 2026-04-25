import { useState, useEffect } from 'react';
import { TeamMember, Project } from '../App';
import { X } from 'lucide-react';

interface TeamMemberModalProps {
  member: TeamMember | null;
  project: Project;
  isManager: boolean;
  onSave: (member: TeamMember) => void;
  onClose: () => void;
}

export function TeamMemberModal({ member, project, isManager, onSave, onClose }: TeamMemberModalProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    role: '',
    skills: [],
    ...member,
  });

  useEffect(() => {
    if (member) {
      setFormData(member);
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMember: TeamMember = {
      id: member?.id || `team-${Date.now()}`,
      name: formData.name || '',
      email: formData.email || '',
      role: formData.role || '',
      skills: formData.skills || [],
    };

    onSave(newMember);
  };

  const handleToggleSkill = (skill: string) => {
    if (formData.skills?.includes(skill)) {
      setFormData({
        ...formData,
        skills: formData.skills.filter(s => s !== skill),
      });
    } else {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), skill],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-gray-900">
            {member ? 'Edit Team Member' : isManager ? 'Invite Team Member' : 'Your Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Email - Only field required when inviting (for managers) */}
            {isManager && !member && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="team.member@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Team member with this email can enroll to the project and set their profile
                </p>
              </div>
            )}

            {/* Name - Shown when editing or for non-managers */}
            {(member || !isManager) && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={isManager && member !== null}
                />
              </div>
            )}

            {/* Email - Shown when editing */}
            {member && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
            )}

            {/* Role - Shown when editing or for non-managers */}
            {(member || !isManager) && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Role *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Frontend Developer, UI Designer, QA Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Skills Selection - Shown when editing or for non-managers */}
            {(member || !isManager) && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Skills *
                </label>
                
                {project.registeredSkills.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                    No skills have been registered for this project yet.
                    {isManager && (
                      <p className="text-sm mt-2">
                        Go to Resource Management to add skills.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                      {project.registeredSkills.map((skill) => (
                        <label
                          key={skill}
                          className="flex items-center gap-2 p-2 hover:bg-purple-50 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.skills?.includes(skill) || false}
                            onChange={() => handleToggleSkill(skill)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                    
                    {formData.skills && formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {(!formData.skills || formData.skills.length === 0) && (
                      <p className="text-sm text-red-600 mt-1">
                        Please select at least one skill
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
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
              disabled={
                isManager && !member
                  ? !formData.email // Only email required for invitation
                  : !formData.name || !formData.email || !formData.role || !formData.skills || formData.skills.length === 0
              }
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {member ? 'Save Changes' : isManager ? 'Send Invitation' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
