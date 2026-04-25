import { useState } from 'react';
import { Project, User } from '../App';
import { UserIcon, Award, Mail, Briefcase, Edit2, Save, X } from 'lucide-react';

interface TeamMemberProfileProps {
  project: Project;
  currentUser: User;
  onUpdateProject: (project: Project) => void;
}

export function TeamMemberProfile({ project, currentUser, onUpdateProject }: TeamMemberProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const currentMember = project.teamMembers.find(tm => tm.email === currentUser.email);
  
  const [formData, setFormData] = useState({
    role: currentMember?.role || '',
    skills: currentMember?.skills || [],
  });

  const handleSave = () => {
    if (!currentMember) return;

    const updatedTeamMembers = project.teamMembers.map(tm =>
      tm.email === currentUser.email
        ? { ...tm, role: formData.role, skills: formData.skills }
        : tm
    );

    onUpdateProject({ ...project, teamMembers: updatedTeamMembers });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      role: currentMember?.role || '',
      skills: currentMember?.skills || [],
    });
    setIsEditing(false);
  };

  const handleToggleSkill = (skill: string) => {
    if (formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: formData.skills.filter(s => s !== skill),
      });
    } else {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      });
    }
  };

  if (!currentMember) {
    return (
      <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
        <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600">
          You are not registered as a team member in this project.
        </p>
      </div>
    );
  }

  // Get tasks assigned to this user
  const myTasks = project.tasks.filter(task => task.assignee === currentUser.email);
  const completedTasks = myTasks.filter(task => task.status === 'done');

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-3xl">
                {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-white mb-1">{currentUser.name}</h2>
              <p className="text-purple-100">{currentMember.role || 'No role specified'}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Skills</span>
          </div>
          <div className="text-gray-900">{currentMember.skills.length} skills</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Assigned Tasks</span>
          </div>
          <div className="text-gray-900">{myTasks.length} tasks</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Completed Tasks</span>
          </div>
          <div className="text-gray-900">{completedTasks.length} tasks</div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-gray-900 mb-4">Profile Information</h3>
        
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={currentUser.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              disabled
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Role
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Frontend Developer, UI Designer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={!isEditing}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Skills Management */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900 mb-1">My Skills</h3>
            <p className="text-sm text-gray-600">
              Select skills from the registered skills for this project
            </p>
          </div>
        </div>

        {project.registeredSkills.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">
              No skills have been registered for this project yet.
            </p>
          </div>
        ) : (
          <>
            {/* Skills Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {project.registeredSkills.map((skill) => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => isEditing && handleToggleSkill(skill)}
                    disabled={!isEditing}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                        {skill}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Skills Summary */}
            {!isEditing && formData.skills.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Your selected skills:</div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isEditing && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={formData.skills.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save Skills
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* My Tasks */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-gray-900 mb-4">My Assigned Tasks</h3>
        
        {myTasks.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">
              You don't have any tasks assigned yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          task.status === 'done'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : task.status === 'review'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status === 'done'
                          ? 'Done'
                          : task.status === 'in-progress'
                          ? 'In Progress'
                          : task.status === 'review'
                          ? 'Review'
                          : 'To Do'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.duration && (
                        <span className="text-gray-600">{task.duration} days</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}