import React, { useState } from 'react';
import { X, Plus, Mail, Users, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

const ProjectModal = ({ isOpen, onClose, projects, activeProjectId, onSelectProject, onCreateProject, onInviteMember, members = [] }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('select'); // 'select' | 'create' | 'members'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!name.trim()) {
      setErrorMsg('Project name is required');
      return;
    }
    setLoading(true);
    try {
      await onCreateProject(name.trim(), description.trim());
      setName('');
      setDescription('');
      setSuccessMsg('Project created successfully!');
      setActiveTab('select');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim()) {
      setErrorMsg('Email address is required');
      return;
    }
    setLoading(true);
    try {
      await onInviteMember(activeProjectId, email.trim().toLowerCase());
      setEmail('');
      setSuccessMsg('Member invited successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Invitation failed');
    } finally {
      setLoading(false);
    }
  };

  const activeProject = projects.find((p) => p._id === activeProjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="w-full max-w-md glass-panel p-6 rounded-3xl relative z-10 border border-slate-200 dark:border-slate-800 animate-slide glow-accent flex flex-col h-[520px]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/40">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            <Users className="mr-2 text-primary-500" size={20} />
            <span>Project Workspaces</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/40 mt-4">
          {[
            { id: 'select', name: 'Workspaces' },
            { id: 'create', name: 'New Project' },
            { id: 'members', name: 'Members', disabled: activeProjectId === 'personal' },
          ].map((tab) => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 ${
                tab.disabled 
                  ? 'opacity-35 cursor-not-allowed'
                  : activeTab === tab.id
                    ? 'border-primary-550 text-primary-500 dark:text-primary-400 font-bold'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Viewports */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold mb-3">
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
              {successMsg}
            </div>
          )}

          {/* TAB 1: WORKSPACES LIST */}
          {activeTab === 'select' && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  onSelectProject('personal');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                  activeProjectId === 'personal'
                    ? 'bg-primary-500/10 border-primary-500 text-primary-500 dark:text-primary-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-350 hover:bg-slate-100/50'
                }`}
              >
                <div>
                  <h4 className="text-sm font-bold">Personal Space</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Private workspace for individual tasks</p>
                </div>
                <Sparkles size={16} />
              </button>

              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => {
                    onSelectProject(project._id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                    activeProjectId === project._id
                      ? 'bg-primary-500/10 border-primary-500 text-primary-500 dark:text-primary-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-350 hover:bg-slate-100/50'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-bold truncate max-w-[280px]">{project.name}</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[280px] mt-0.5">
                      Owner: {project.createdBy?.name} • {project.members?.length} Members
                    </p>
                  </div>
                  <Users size={15} />
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: CREATE PROJECT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Marketing Campaign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Description</label>
                <textarea
                  placeholder="Add target project goals, scopes or milestones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-1.5 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-650 hover:from-primary-600 hover:to-indigo-750 text-white font-semibold text-xs transition shadow-lg shadow-primary-550/15"
              >
                <PlusCircle size={15} />
                <span>{loading ? 'Creating...' : 'Create Workspace'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: MEMBERS */}
          {activeTab === 'members' && activeProject && (
            <div className="space-y-5 pt-1 flex flex-col h-full">
              {/* Invite Member form */}
              <form onSubmit={handleInviteSubmit} className="space-y-2 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Invite Team Member</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-3 text-slate-400">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      placeholder="teammember@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-4 rounded-2xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:scale-[1.01]"
                  >
                    Invite
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Current Workspace Members</h4>
                <div className="space-y-2.5">
                  {members.map((member) => (
                    <div key={member._id} className="flex items-center space-x-3 p-1.5 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100/50 dark:border-slate-850">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-slate-400 to-slate-500 flex items-center justify-center text-white text-[11px] font-extrabold shadow-sm capitalize">
                        {member.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-none capitalize">
                          {member.name} {member._id === (activeProject.createdBy?._id || activeProject.createdBy) && <span className="text-[9px] lowercase font-bold text-amber-500 ml-1 px-1 rounded bg-amber-500/10 border border-amber-500/15">owner</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 leading-none">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Check for AlertTriangle to avoid imports issues
const AlertTriangle = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

export default ProjectModal;
