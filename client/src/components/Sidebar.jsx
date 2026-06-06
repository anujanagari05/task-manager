import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  Moon, 
  Sun, 
  CheckSquare, 
  Calendar,
  Layers,
  Bell,
  BellOff,
  X,
  CheckCheck
} from 'lucide-react';

const Sidebar = ({ 
  activePage, 
  setActivePage, 
  isDarkMode, 
  setIsDarkMode, 
  taskStats,
  notifications = [],
  unreadNotificationsCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}) => {
  const { user, logout } = useAuth();
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const navItems = [
    { id: 'personal-board', name: 'Personal Board', icon: CheckSquare },
    { id: 'group-projects', name: 'Group Projects', icon: Layers },
    { id: 'profile', name: 'My Profile', icon: User },
  ];

  return (
    <>
      <aside className="w-80 h-screen fixed left-0 top-0 glass-panel border-r flex flex-col justify-between z-30 transition-all duration-300">
        {/* Branding Header */}
        <div>
          <div className="p-6 flex items-center space-x-3 border-b border-[hsl(var(--border-color))]">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-550/20 animate-pulse-subtle">
              <CheckSquare size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">TaskVibe</h1>
              <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 tracking-wider uppercase mt-1 block">MERN Stack</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 mt-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/10 to-indigo-500/5 text-primary-500 dark:text-primary-400 font-semibold border-l-4 border-primary-500 pl-3'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      size={20} 
                      className={`transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-primary-500 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
                      }`} 
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.id === 'personal-board' && taskStats && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {taskStats.pending || 0}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Settings */}
        <div>
          {/* Quick Stats overview panel */}
          {taskStats && (
            <div className="mx-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 dark:text-slate-500 flex items-center"><Calendar size={12} className="mr-1" /> Pending</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{taskStats.pending}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 dark:text-slate-500 flex items-center"><Layers size={12} className="mr-1" /> Completed</span>
                <span className="font-semibold text-green-500">{taskStats.completed}</span>
              </div>
              {/* Completion rate bar */}
              <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-850">
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1">
                  <span>Completion Rate</span>
                  <span>{taskStats.rate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                    style={{ width: `${taskStats.rate}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Settings, Dark Mode & User Profile details */}
          <div className="p-4 border-t border-[hsl(var(--border-color))] space-y-4">
            {/* Theme & Notifications */}
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Settings</span>
              <div className="flex items-center space-x-2">
                {/* Real-time Notifications Bell */}
                <button
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 relative"
                  title="Notifications"
                >
                  <Bell size={18} className="text-slate-500 dark:text-slate-400" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Dark / Light Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
                  aria-label="Toggle Dark Mode"
                >
                  {isDarkMode ? (
                    <Sun size={18} className="text-amber-400" />
                  ) : (
                    <Moon size={18} className="text-slate-700" />
                  )}
                </button>
              </div>
            </div>

            {/* User Block */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[110px] leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[110px]">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sliding Glassmorphic Notification Drawer Overlay */}
      {isNotificationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsNotificationDrawerOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm h-screen bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800/80 shadow-2xl p-6 flex flex-col justify-between animate-slide-left text-slate-800 dark:text-slate-100">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800/40 mb-4">
                <div className="flex items-center space-x-2">
                  <Bell size={18} className="text-primary-500" />
                  <h3 className="text-sm font-extrabold tracking-tight uppercase">Workspace Alerts</h3>
                </div>
                <button 
                  onClick={() => setIsNotificationDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick Options */}
              {notifications.length > 0 && (
                <div className="flex justify-between items-center mb-3.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {unreadNotificationsCount} outstanding
                  </span>
                  <button 
                    onClick={onMarkAllAsRead}
                    className="text-[10px] font-extrabold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
                  >
                    <CheckCheck size={12} className="mr-1" /> Mark all read
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[calc(100vh-180px)] space-y-3 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 flex items-center justify-center mx-auto opacity-70">
                      <BellOff size={20} className="stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Workspace Quiet</p>
                      <p className="text-[10px] text-slate-450 mt-1 max-w-[220px] mx-auto leading-relaxed">
                        No recent activity. Real-time mentions, comments, and task assignments will sync here.
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`p-3.5 rounded-2xl border transition-all duration-200 relative group flex items-start space-x-3 ${
                        notif.isRead 
                          ? 'border-slate-100 dark:border-slate-900/50 bg-slate-50/20 dark:bg-slate-900/10 opacity-70' 
                          : 'border-primary-500/20 dark:border-primary-500/10 bg-primary-500/5 dark:bg-primary-500/5 glow-accent'
                      }`}
                    >
                      {/* Active Indicator dot */}
                      {!notif.isRead && (
                        <span className="absolute top-3.5 left-2 h-1.5 w-1.5 rounded-full bg-primary-500 shadow shadow-primary-500/40" />
                      )}
                      
                      {/* Sender Avatar */}
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary-400 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-sm flex-shrink-0">
                        {notif.sender?.name ? notif.sender.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2) : 'S'}
                      </div>

                      {/* Text details */}
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <p className="text-xs leading-relaxed font-medium text-slate-650 dark:text-slate-300">
                          {notif.message}
                        </p>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-550 mt-1 font-semibold">
                          <span>
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          
                          {!notif.isRead && (
                            <button 
                              onClick={() => onMarkAsRead(notif._id)}
                              className="font-bold text-primary-500 dark:text-primary-400 hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delete notification */}
                      <button 
                        onClick={() => onDeleteNotification(notif._id)}
                        className="p-1 rounded text-slate-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-550/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Dismiss alert"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 text-center text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              TaskVibe ⚡ Live Collaboration
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
