import { User } from '../App';
import { ProjectList } from '../components/project-list';

interface DashboardPageProps {
  currentUser: User;
  onLogout: () => void;
}

export default function DashboardPage({
  currentUser,
  onLogout,
}: DashboardPageProps) {
  return (
    <ProjectList
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}
