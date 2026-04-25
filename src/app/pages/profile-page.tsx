import { User, Project } from '../App';
import { TeamMemberProfile } from '../components/team-member-profile';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
  projects: Project[];
}

export default function ProfilePage({ currentUser, projects }: ProfilePageProps) {
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
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamMemberProfile member={currentUser} projects={projects} />
      </div>
    </div>
  );
}
