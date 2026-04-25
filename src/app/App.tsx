import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes';
import { Toaster } from './components/ui/sonner';
import { getCurrentUser, clearAuthToken, getAuthToken } from './services/api-client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  taskIds: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  requiredSkills: string[];
  startDate?: string;
  endDate?: string;
  duration: number; // in days
  dependencies: string[]; // task IDs
  priority: 'low' | 'medium' | 'high';
  sprintId?: string; // Sprint assignment
  storyPoints?: number; // For scrum estimation
}

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  members: string[];
  teamMembers: TeamMember[];
  registeredSkills: string[]; // Skills registered by project manager
  tasks: Task[];
  sprints: Sprint[];
  createdAt: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth session on mount
  useEffect(() => {
    const token = getAuthToken();
    const savedUser = getCurrentUser();

    if (token && savedUser) {
      setCurrentUser(savedUser);
    }

    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  // Create router with context
  const router = createAppRouter({
    currentUser,
    setCurrentUser,
    handleLogin,
    handleSignup,
    handleLogout,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}