import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth, API_URL } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectsDashboard from './pages/ProjectsDashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  
  // Layout Navigation State
  const [activePage, setActivePage] = useState('personal-board');
  const [activeProjectId, setActiveProjectId] = useState('personal');
  const [showRegister, setShowRegister] = useState(false);
  
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    high: 0,
    rate: 0,
  });

  // Dark/Light Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Collaborative Shared State
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Sync unread count
  useEffect(() => {
    setUnreadNotificationsCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  // Fetch initial projects list
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data);
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchProjects();
    }
  }, [user]);

  // Apply dark class to document HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNewNotification = (newNotif) => {
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleCreateProject = async (name, description, membersEmails) => {
    try {
      const res = await axios.post(`${API_URL}/api/projects`, {
        name,
        description,
        members: membersEmails,
      });
      setProjects((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId('personal');
        setActivePage('personal-board');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const handleInviteMember = async (projectId, email) => {
    try {
      const res = await axios.post(`${API_URL}/api/projects/${projectId}/invite`, { email });
      setProjects((prev) => prev.map((p) => (p._id === projectId ? res.data : p)));
      return res.data;
    } catch (err) {
      console.error('Error inviting member:', err);
      throw err;
    }
  };

  // If initial auth sync is loading, render a high-end loaded spinner
  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-primary-500/10 border-t-primary-500 animate-spin" />
          <Loader2 className="absolute text-primary-550 animate-spin-slow" size={24} />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Syncing secure workspace session...
        </p>
      </div>
    );
  }

  // Unauthenticated Layout (Show Login / Register cards)
  if (!user) {
    if (showRegister) {
      return (
        <Register
          onSwitchToLogin={() => setShowRegister(false)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      );
    }
    return (
      <Login
        onSwitchToRegister={() => setShowRegister(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  const activeProject = projects.find((p) => p._id === activeProjectId);

  // Authenticated Layout (Sidebar + Active page viewport)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex relative transition-colors duration-300">
      
      {/* Sidebar Navigation Drawer */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page === 'personal-board') {
            setActiveProjectId('personal');
          }
        }}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        taskStats={taskStats}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
      />

      {/* Render Active Viewport Page */}
      <main className="flex-1 w-full relative z-10">
        {activePage === 'personal-board' || activePage === 'project-board' ? (
          <Dashboard 
            updateTaskStats={setTaskStats} 
            onNotificationReceived={handleNewNotification}
            projects={projects}
            activeProjectId={activeProjectId}
            setActiveProjectId={(id) => {
              setActiveProjectId(id);
              setActivePage(id === 'personal' ? 'personal-board' : 'project-board');
            }}
            onCreateProject={handleCreateProject}
            onInviteMember={handleInviteMember}
            onDeleteProject={handleDeleteProject}
          />
        ) : activePage === 'group-projects' ? (
          <ProjectsDashboard 
            projects={projects}
            onCreateProject={handleCreateProject}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setActivePage('project-board');
            }}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <Profile stats={taskStats} />
        )}
      </main>

    </div>
  );
};

// Wrap App content inside Auth provider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
