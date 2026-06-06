import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Layers, 
  Users, 
  Trash2, 
  ArrowRight, 
  Mail, 
  Calendar, 
  PlusCircle, 
  Sparkles,
  User,
  X
} from 'lucide-react';

const ProjectsDashboard = ({ projects = [], onCreateProject, onSelectProject, onDeleteProject }) => {
  const { user } = useAuth();
  
  // Creation Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [emailsList, setEmailsList] = useState([]);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEmail = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    
    // Quick regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    
    if (email === user.email) {
      setErrorMsg('You are already included automatically as the creator');
      return;
    }

    if (emailsList.includes(email)) {
      setErrorMsg('Email already added to invitation list');
      return;
    }

    setEmailsList((prev) => [...prev, email]);
    setMemberEmail('');
  };

  const handleRemoveEmail = (email) => {
    setEmailsList((prev) => prev.filter((e) => e !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Project name is required');
      return;
    }

    setLoading(true);
    try {
      await onCreateProject(name.trim(), description.trim(), emailsList);
      setName('');
      setDescription('');
      setEmailsList([]);
      setSuccessMsg('Collaborative project created successfully!');
      
      // Auto dismiss success toast after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Project creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 space-y-8 animate-fade ml-80 relative overflow-x-hidden">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
          Group Workspaces
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Collaborate on shared projects, manage team members, and track group performance.
        </p>
      </div>

      {/* Grid: Projects list vs Creation panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Projects Grid (8 Columns) */}
        <div className="xl:col-span-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Active Project Boards ({projects.length})
            </h3>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel py-20 px-6 rounded-3xl border text-center max-w-lg mx-auto space-y-4 animate-slide">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 flex items-center justify-center text-primary-500 mx-auto shadow-inner border border-primary-550/10">
                <Layers size={24} className="stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Group Workspaces</h3>
                <p className="text-xs text-slate-450 max-w-xs mx-auto mt-2 leading-relaxed">
                  You are not a member of any collaborative projects. Create a new project workspace on the right to start collaborating!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const isCreator = project.createdBy?._id === user?._id || project.createdBy === user?._id;
                
                return (
                  <div 
                    key={project._id}
                    className="glass-panel glass-panel-interactive p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow flex flex-col justify-between h-56 relative group hover:scale-[1.01]"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden pr-6">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate" title={project.name}>
                            {project.name}
                          </h4>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 flex items-center mt-1">
                            <Calendar size={9} className="mr-1" />
                            Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {isCreator && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to permanently delete project "${project.name}"?`)) {
                                onDeleteProject(project._id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-550/10 transition opacity-0 group-hover:opacity-100 duration-200 absolute top-4 right-4"
                            title="Delete Workspace"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                        {project.description || <span className="italic text-slate-350 dark:text-slate-600">No project description.</span>}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-3.5 mt-3">
                      {/* Members overview */}
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {project.members?.slice(0, 4).map((member) => (
                            <div 
                              key={member._id}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-950 bg-gradient-to-tr from-slate-400 to-indigo-500 text-white text-[8px] font-bold flex items-center justify-center uppercase"
                              title={`${member.name} (${member.email})`}
                            >
                              {member.name[0]}
                            </div>
                          ))}
                          {project.members?.length > 4 && (
                            <div 
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-950 bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 flex items-center justify-center"
                              title={`${project.members.length - 4} more`}
                            >
                              +{project.members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-450 font-bold flex items-center">
                          <Users size={10} className="mr-1" />
                          {project.members?.length || 1}
                        </span>
                      </div>

                      {/* Button to enter board */}
                      <button
                        onClick={() => onSelectProject(project._id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-extrabold text-[10px] flex items-center space-x-1 transition-all"
                      >
                        <span>Board</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Create Workspace form (4 Columns) */}
        <div className="xl:col-span-4 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
            <div className="h-8.5 w-8.5 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Create New Workspace</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Project Name *</label>
              <input
                type="text"
                placeholder="e.g. Mobile App Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Description</label>
              <textarea
                placeholder="Milestones, scopes, or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white resize-none focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Invite members on create */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/40 pt-3">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center">
                <Users size={11} className="mr-1 text-primary-500" />
                Invite Team Members
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    placeholder="member@domain.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="py-2 px-3 rounded-2xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] hover:scale-[1.01]"
                >
                  Add
                </button>
              </div>

              {/* Invited list visual tags */}
              {emailsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {emailsList.map((email) => (
                    <span 
                      key={email}
                      className="px-2 py-0.5 rounded-full border border-primary-500/20 bg-primary-500/5 text-[9px] font-bold text-primary-500 dark:text-primary-400 flex items-center space-x-1"
                    >
                      <span className="truncate max-w-[120px]">{email}</span>
                      <button type="button" onClick={() => handleRemoveEmail(email)} className="hover:text-rose-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-1.5 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-650 hover:from-primary-600 hover:to-indigo-750 text-white font-semibold text-xs transition shadow-lg shadow-primary-550/15"
            >
              <PlusCircle size={14} />
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ProjectsDashboard;
