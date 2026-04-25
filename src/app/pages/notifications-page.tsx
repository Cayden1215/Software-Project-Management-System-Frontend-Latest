import { User, Project } from '../App';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, CheckCircle, UserPlus, Briefcase, Calendar, AlertCircle, Info } from 'lucide-react';
import { useMemo } from 'react';

interface NotificationsPageProps {
  currentUser: User;
  projects: Project[];
}

interface Notification {
  id: string;
  type: 'invitation' | 'task_assigned' | 'task_updated' | 'project_update' | 'deadline' | 'info';
  title: string;
  message: string;
  timestamp: string;
  projectId?: string;
  read: boolean;
}

export default function NotificationsPage({ currentUser, projects }: NotificationsPageProps) {
  const navigate = useNavigate();

  // Generate notifications based on user's projects and invitations
  const notifications = useMemo(() => {
    const notifs: Notification[] = [];

    // Check for project invitations
    projects.forEach((project) => {
      const isInvited = project.teamMembers.some(
        (tm) => tm.email === currentUser.email && !project.members.includes(currentUser.email)
      );
      
      if (isInvited) {
        notifs.push({
          id: `invite-${project.id}`,
          type: 'invitation',
          title: 'Project Invitation',
          message: `You've been invited to join "${project.name}"`,
          timestamp: new Date(project.createdAt).toISOString(),
          projectId: project.id,
          read: false,
        });
      }
    });

    // Check for assigned tasks
    projects.forEach((project) => {
      if (project.members.includes(currentUser.email)) {
        const assignedTasks = project.tasks.filter((task) => task.assignee === currentUser.email);
        
        assignedTasks.forEach((task) => {
          if (task.status === 'todo') {
            notifs.push({
              id: `task-${task.id}`,
              type: 'task_assigned',
              title: 'New Task Assigned',
              message: `"${task.title}" has been assigned to you in ${project.name}`,
              timestamp: new Date().toISOString(),
              projectId: project.id,
              read: false,
            });
          }
        });

        // Check for upcoming deadlines
        assignedTasks.forEach((task) => {
          if (task.endDate) {
            const deadline = new Date(task.endDate);
            const today = new Date();
            const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 3 && daysUntil > 0 && task.status !== 'done') {
              notifs.push({
                id: `deadline-${task.id}`,
                type: 'deadline',
                title: 'Upcoming Deadline',
                message: `"${task.title}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
                timestamp: new Date().toISOString(),
                projectId: project.id,
                read: false,
              });
            }
          }
        });
      }
    });

    // Add welcome notification for new users
    if (notifs.length === 0) {
      notifs.push({
        id: 'welcome',
        type: 'info',
        title: 'Welcome to Project Management System',
        message: 'Start by browsing available projects or creating your own!',
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // Sort by timestamp (newest first)
    return notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [projects, currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'task_assigned':
        return <Briefcase className="w-5 h-5 text-purple-600" />;
      case 'task_updated':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'project_update':
        return <Bell className="w-5 h-5 text-orange-600" />;
      case 'deadline':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invitation':
        return 'bg-blue-50 border-blue-200';
      case 'task_assigned':
        return 'bg-purple-50 border-purple-200';
      case 'task_updated':
        return 'bg-green-50 border-green-200';
      case 'project_update':
        return 'bg-orange-50 border-orange-200';
      case 'deadline':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.projectId) {
      navigate(`/projects/${notification.projectId}`);
    } else if (notification.type === 'info') {
      navigate('/browse');
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
            <div className="flex items-center gap-2">
              <h1 className="text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-2">
              We'll notify you when there's something new
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all ${
                  getNotificationColor(notification.type)
                } ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-gray-900">{notification.title}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.type === 'invitation' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/browse');
                        }}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Invitation
                      </button>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
