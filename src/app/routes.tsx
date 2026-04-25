import { createBrowserRouter, Navigate } from 'react-router';
import { User } from './App';
import LoginPage from './pages/login-page';
import SignupPage from './pages/signup-page';
import DashboardPage from './pages/dashboard-page';
import ProjectWorkspacePage from './pages/project-workspace-page';
import SettingsPage from './pages/settings-page';
import AboutPage from './pages/about-page';
import RootLayout from './layouts/root-layout';
import AuthLayout from './layouts/auth-layout';
import NotFoundPage from './pages/not-found-page';

interface RouterContext {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  handleLogin: (user: User) => void;
  handleSignup: (user: User) => void;
  handleLogout: () => void;
}

export const createAppRouter = (context: RouterContext) => {
  return createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: context.currentUser ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          ),
        },
        // Auth routes
        {
          path: 'login',
          element: context.currentUser ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout />
          ),
          children: [
            {
              index: true,
              element: <LoginPage onLogin={context.handleLogin} />,
            },
          ],
        },
        {
          path: 'signup',
          element: context.currentUser ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout />
          ),
          children: [
            {
              index: true,
              element: <SignupPage onSignup={context.handleSignup} />,
            },
          ],
        },
        // Protected routes
        {
          path: 'dashboard',
          element: context.currentUser ? (
            <DashboardPage
              currentUser={context.currentUser}
              onLogout={context.handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          ),
        },
        {
          path: 'projects/:projectId',
          element: context.currentUser ? (
            <ProjectWorkspacePage
              currentUser={context.currentUser}
            />
          ) : (
            <Navigate to="/login" replace />
          ),
        },
        {
          path: 'settings',
          element: context.currentUser ? (
            <SettingsPage currentUser={context.currentUser} onLogout={context.handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          ),
        },
        {
          path: 'about',
          element: <AboutPage />,
        },
        // 404 page
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ]);
};