import React, { useState, useEffect } from 'react';
import { X, Calendar, UserCheck, AlertTriangle } from 'lucide-react';
import CommentFeed from './CommentFeed';

const TaskFormModal = ({ isOpen, onClose, onSubmit, task = null, activeProjectId, projectMembers = [], onAddComment, onDeleteComment }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [validationError, setValidationError] = useState('');

  const isProjectTask = activeProjectId && activeProjectId !== 'personal';

  // Hydrate fields
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
      
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
      } else {
        setDueDate('');
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');
    }
    setValidationError('');
  }, [task, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Task title is required');
      return;
    }
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      project: isProjectTask ? activeProjectId : null,
    });
  };

  const priorities = ['low', 'medium', 'high'];

  const priorityColors = {
    low: 'border-emerald-250 dark:border-emerald-900/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20',
    medium: 'border-amber-250 dark:border-amber-900/40 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20',
    high: 'border-rose-250 dark:border-rose-900/40 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20',
  };

  const prioritySelectedColors = {
    low: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20',
    medium: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20',
    high: 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Layout split if Comments are displayed (Task Details) */}
      <div 
        className={`w-full max-w-lg glass-panel p-6 rounded-3xl relative z-10 border border-slate-200 dark:border-slate-800 animate-slide glow-accent flex flex-col ${
          task ? 'lg:max-w-3xl lg:grid lg:grid-cols-12 lg:gap-6' : ''
        }`}
        role="dialog"
      >
        {/* Left Column: Task Data Form */}
        <div className={task ? 'lg:col-span-7' : 'w-full'}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/40 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
              {task ? 'Edit Task Details' : 'Create New Task'}
            </h2>
            {!task && (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {validationError && (
              <div className="flex items-center space-x-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                <AlertTriangle size={14} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setValidationError('');
                }}
                placeholder="e.g. Redesign header workspace"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task instructions or notes..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white resize-none"
              />
            </div>

            {/* Row: Priority & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Priority</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {priorities.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 border rounded-xl font-bold capitalize text-[10px] text-center transition-all ${
                        priority === p ? prioritySelectedColors[p] : priorityColors[p]
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white cursor-pointer"
                />
              </div>
            </div>

            {/* Task Assignment (Only if associated to group projects) */}
            {isProjectTask && projectMembers.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center">
                  <UserCheck size={11} className="mr-1 text-primary-500" /> Assign To Member
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center space-x-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-650 text-white font-bold text-xs hover:from-primary-600 transition shadow-lg shadow-primary-550/15"
              >
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Task discussion Feed (Only visible when editing an existing task!) */}
        {task && (
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-150 dark:border-slate-800/40 pt-4 lg:pt-0 lg:pl-5 flex flex-col justify-between mt-4 lg:mt-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/40 mb-3 flex-shrink-0">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Task Discussion</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 lg:hidden">
                <X size={15} />
              </button>
              <button onClick={onClose} className="hidden lg:block p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={15} />
              </button>
            </div>
            
            <div className="flex-1">
              <CommentFeed
                comments={task.comments || []}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                taskCreatorId={task.user?._id || task.user}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFormModal;
