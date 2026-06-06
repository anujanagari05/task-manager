import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth, API_URL } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import ProjectModal from '../components/ProjectModal';
import KanbanBoard from '../components/KanbanBoard';
import { 
  Plus, 
  Search, 
  ListFilter, 
  ArrowUpDown,
  RefreshCw,
  X,
  Users,
  Grid,
  Kanban,
  Layers,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Trash2
} from 'lucide-react';

const Dashboard = ({ 
  updateTaskStats, 
  onNotificationReceived,
  projects = [],
  activeProjectId = 'personal',
  setActiveProjectId,
  onCreateProject,
  onInviteMember,
  onDeleteProject
}) => {
  const { user } = useAuth();
  
  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Layout / Workspace Settings
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'kanban'
  const [liveToast, setLiveToast] = useState(null);

  // Modals Toggles
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const socketRef = useRef(null);

  // Stats calculation
  const calculateStats = useCallback((taskList) => {
    const total = taskList.length;
    const completed = taskList.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    const high = taskList.filter((t) => t.priority === 'high' && t.status !== 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const computedStats = { total, pending, completed, high, rate };
    if (updateTaskStats) updateTaskStats(computedStats);
  }, [updateTaskStats]);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('project', activeProjectId);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await axios.get(`${API_URL}/api/tasks?${params.toString()}`);
      setTasks(response.data);

      // Re-run stats calculation over unfiltered tasks of active workspace
      const rawResponse = await axios.get(`${API_URL}/api/tasks?project=${activeProjectId}`);
      calculateStats(rawResponse.data);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError(err.response?.data?.message || 'Failed to sync your tasks.');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, statusFilter, priorityFilter, searchQuery, sortBy, sortOrder, calculateStats]);

  // Establish WebSockets listeners & setup
  useEffect(() => {
    // Connect socket
    socketRef.current = io(API_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket Connected Client:', socketRef.current.id);
      if (user) {
        socketRef.current.emit('register_user', user._id);
      }
    });

    // Listen for direct personal notifications
    socketRef.current.on('notification_received', (data) => {
      console.log('Notification received client:', data);
      if (onNotificationReceived) {
        onNotificationReceived(data);
      }
      setLiveToast({ text: data.message, type: 'notification' });
    });

    // Listeners for live collaborative task edits
    socketRef.current.on('task_created', (data) => {
      setLiveToast({ text: data.message, type: 'create' });
      fetchTasks();
    });

    socketRef.current.on('task_updated', (data) => {
      setLiveToast({ text: data.message, type: 'update' });
      fetchTasks();
    });

    socketRef.current.on('task_deleted', (data) => {
      setLiveToast({ text: data.message, type: 'delete' });
      fetchTasks();
    });

    socketRef.current.on('project_updated', (data) => {
      setLiveToast({ text: data.message, type: 'project' });
      fetchTasks();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchTasks, user, onNotificationReceived]);

  // Room Joiner/Leaver whenever active project changes
  useEffect(() => {
    if (socketRef.current && activeProjectId !== 'personal') {
      socketRef.current.emit('join_project', activeProjectId);
    }

    return () => {
      if (socketRef.current && activeProjectId !== 'personal') {
        socketRef.current.emit('leave_project', activeProjectId);
      }
    };
  }, [activeProjectId]);

  // Toast autocloser
  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => setLiveToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

  // Reload tasks when filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTasks();
    }, searchQuery.trim() ? 350 : 0);

    return () => clearTimeout(delayDebounce);
  }, [activeProjectId, statusFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  // Task Actions CRUD Hooks
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: nextStatus } : t))
      );
      await axios.put(`${API_URL}/api/tasks/${id}`, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleModalSubmit = async (taskData) => {
    try {
      if (selectedTask) {
        await axios.put(`${API_URL}/api/tasks/${selectedTask._id}`, taskData);
      } else {
        await axios.post(`${API_URL}/api/tasks`, taskData);
      }
      setIsTaskModalOpen(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Submission error');
    }
  };

  const handleAddComment = async (text) => {
    if (!selectedTask) return;
    try {
      const response = await axios.post(`${API_URL}/api/tasks/${selectedTask._id}/comments`, { text });
      setSelectedTask(response.data);
      setTasks((prev) => prev.map((t) => (t._id === selectedTask._id ? response.data : t)));
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTask) return;
    try {
      const response = await axios.delete(`${API_URL}/api/tasks/${selectedTask._id}/comments/${commentId}`);
      setSelectedTask(response.data);
      setTasks((prev) => prev.map((t) => (t._id === selectedTask._id ? response.data : t)));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      await axios.delete(`${API_URL}/api/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      fetchTasks();
    }
  };

  const handleAddTaskClick = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleModalCreateProject = async (name, description) => {
    await onCreateProject(name, description, []);
  };

  const activeProject = projects.find((p) => p._id === activeProjectId);
  const projectMembers = activeProject?.members || [];
  const isProjectOwner = activeProject?.createdBy?._id === user?._id || activeProject?.createdBy === user?._id;

  // Render Stats counters values
  const statsPending = tasks.filter((t) => t.status === 'pending').length;
  const statsCompleted = tasks.filter((t) => t.status === 'completed').length;
  const statsHigh = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 space-y-8 animate-fade ml-80 relative overflow-x-hidden">
      
      {/* Toast Alert overlay for real-time WebSocket activities */}
      {liveToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl glass-panel border border-primary-500/20 bg-primary-500/10 text-slate-800 dark:text-white text-xs font-semibold flex items-center space-x-3 animate-fade shadow-xl w-80 glow-accent">
          <div className="h-7 w-7 rounded-lg bg-primary-500 text-white flex items-center justify-center animate-bounce">
            <Bell size={13} />
          </div>
          <div className="flex-1">
            <h5 className="font-bold leading-none text-primary-500 uppercase tracking-wide text-[9px] mb-0.5">Real-Time Sync</h5>
            <p className="leading-tight text-slate-500 dark:text-slate-350">{liveToast.text}</p>
          </div>
          <button onClick={() => setLiveToast(null)} className="p-1 rounded text-slate-400 hover:bg-slate-200/50">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Top Header Row (Project Selection & Actions) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-100 dark:border-slate-800/40 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-350 font-bold text-xs flex items-center space-x-2 transition"
            >
              <Users size={13} className="text-primary-500" />
              <span>{activeProjectId === 'personal' ? 'Personal Space' : `Workspace: ${activeProject?.name}`}</span>
            </button>
            
            {activeProjectId !== 'personal' && isProjectOwner && (
              <button
                onClick={() => onDeleteProject(activeProjectId)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-550/10 transition"
                title="Close Project Workspace"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mt-3.5">
            {activeProjectId === 'personal' ? 'Personal Board' : activeProject?.name}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-[450px] truncate leading-tight">
            {activeProjectId === 'personal' ? 'Private standalone todo lists.' : activeProject?.description || 'Collaborative workspace.'}
          </p>
        </div>

        {/* Form controls (Add Task, Switch Board view) */}
        <div className="flex items-center space-x-2.5">
          {/* Grid vs Kanban toggle */}
          <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/40">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-2 transition-all ${layoutMode === 'grid' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`p-2 transition-all ${layoutMode === 'kanban' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'text-slate-400'}`}
              title="Kanban Board"
            >
              <Kanban size={15} />
            </button>
          </div>

          <button
            onClick={handleAddTaskClick}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-650 text-white font-bold text-xs transition shadow-lg shadow-primary-550/15"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Workspace Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5.5">
        {[
          { label: 'Board Tasks', value: tasks.length, color: 'text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800', icon: Layers },
          { label: 'Active Outstanding', value: statsPending, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-100 dark:border-amber-900/35', icon: Clock },
          { label: 'Finished items', value: statsCompleted, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/35', icon: CheckCircle },
          { label: 'Critical High', value: statsHigh, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-100 dark:border-rose-900/35', icon: AlertCircle },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`glass-panel p-4.5 rounded-2xl border flex items-center justify-between ${card.color}`}>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">{card.label}</p>
                <p className="text-xl font-black mt-1 leading-none">{card.value}</p>
              </div>
              <div className="h-8.5 w-8.5 rounded-lg flex items-center justify-center bg-white/40 dark:bg-black/10 border border-black/5 dark:border-white/5">
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Workspace Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 flex-shrink-0">
        
        {/* Status filter buttons */}
        <div className="flex items-center space-x-1.5">
          {['all', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-bold capitalize transition ${
                statusFilter === tab
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Search title/desc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-450">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-white cursor-pointer focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sorting controls */}
          <div className="flex items-center space-x-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-white cursor-pointer focus:outline-none"
            >
              <option value="createdAt">Date Created</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-700"
            >
              <ArrowUpDown size={13} className={sortOrder === 'desc' ? 'transform rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </div>
        </div>

      </div>

      {/* Main Board Workspace renders */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-150 dark:border-slate-800/40 h-48 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4.5 w-32 rounded bg-slate-200 dark:bg-slate-800/50 shimmer-bg" />
                <div className="h-4.5 w-10 rounded bg-slate-200 dark:bg-slate-800/50 shimmer-bg" />
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800/50 shimmer-bg" />
                <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800/50 shimmer-bg" />
              </div>
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800/50 shimmer-bg mt-6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-center max-w-lg mx-auto">
          <AlertCircle size={35} className="text-rose-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wide">Sync Fail</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{error}</p>
          <button onClick={fetchTasks} className="mt-4 inline-flex items-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">
            <RefreshCw size={11} /> <span>Try Again</span>
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel py-16 px-6 rounded-3xl border text-center max-w-md mx-auto space-y-4 animate-slide">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 flex items-center justify-center text-primary-500 mx-auto shadow-inner border border-primary-550/10">
            <Layers size={24} className="stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Workspace Empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              No tasks matched your parameters. Add some tasks to initialize the work progress!
            </p>
          </div>
          <button onClick={handleAddTaskClick} className="inline-flex items-center space-x-1.5 py-2.5 px-4.5 rounded-xl bg-slate-850 dark:bg-white text-white dark:text-slate-900 font-bold text-xs">
            <Plus size={12} className="stroke-[2.5]" /> <span>Add Tasks</span>
          </button>
        </div>
      ) : layoutMode === 'kanban' ? (
        /* KANBAN BOARD */
        <KanbanBoard
          tasks={tasks}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEditClick}
          onDelete={handleDeleteTask}
        />
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
          {tasks.map((task) => (
            <div key={task._id} className="group">
              <TaskCard
                task={task}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEditClick}
                onDelete={handleDeleteTask}
              />
            </div>
          ))}
        </div>
      )}

      {/* Task Creation & Comments detail Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleModalSubmit}
        task={selectedTask}
        activeProjectId={activeProjectId}
        projectMembers={projectMembers}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* Workspaces & Team Members invitations Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onCreateProject={handleModalCreateProject}
        onInviteMember={onInviteMember}
        members={projectMembers}
      />

    </div>
  );
};

export default Dashboard;
