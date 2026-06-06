import React from 'react';
import { 
  Trash2, 
  Edit3, 
  Calendar, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  User 
} from 'lucide-react';

const TaskCard = ({ task, onToggleStatus, onEdit, onDelete }) => {
  const { _id, title, description, status, priority, dueDate, assignedTo } = task;

  const isCompleted = status === 'completed';

  const priorityStyles = {
    high: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-600 dark:text-rose-450',
      border: 'border-rose-100 dark:border-rose-900/30',
      glow: 'shadow-rose-500/5',
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-600 dark:text-amber-450',
      border: 'border-amber-100 dark:border-amber-900/30',
      glow: 'shadow-amber-500/5',
    },
    low: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-450',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      glow: 'shadow-emerald-500/5',
    },
  };

  const style = priorityStyles[priority] || priorityStyles.medium;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDateStatus = (dateStr) => {
    if (!dateStr) return 'none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);

    if (due < today) return 'overdue';
    if (due.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const dateStatus = getDateStatus(dueDate);

  return (
    <div 
      className={`glass-panel glass-panel-interactive p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between h-48 ${
        isCompleted 
          ? 'opacity-65 border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/20 shadow-none hover:translate-y-0 hover:shadow-none' 
          : `${style.border} ${style.glow}`
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-2.5 max-w-[80%]">
            <button
              onClick={() => onToggleStatus(_id, status)}
              className="mt-0.5 text-slate-450 hover:text-primary-500 transition-colors duration-150 flex-shrink-0"
            >
              {isCompleted ? (
                <CheckCircle2 className="text-emerald-500 fill-emerald-50 dark:fill-emerald-950/20" size={18} />
              ) : (
                <Circle className="text-slate-300 dark:text-slate-650" size={18} />
              )}
            </button>
            
            <div className="overflow-hidden">
              <h3 
                className={`font-semibold text-xs text-slate-850 dark:text-white leading-tight truncate ${
                  isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                }`}
                title={title}
              >
                {title}
              </h3>
            </div>
          </div>

          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
            {priority}
          </span>
        </div>

        {/* Description */}
        <p className={`text-[11px] mt-2.5 text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed ${isCompleted ? 'text-slate-400/80 dark:text-slate-650' : ''}`}>
          {description || <span className="italic text-slate-350 dark:text-slate-650">No description provided.</span>}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/40">
        
        {/* Left Side: Date / Assignee */}
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {dueDate ? (
            <div 
              className={`flex items-center space-x-1 text-[10px] font-semibold ${
                isCompleted 
                  ? 'text-slate-450 dark:text-slate-600' 
                  : dateStatus === 'overdue'
                    ? 'text-rose-500'
                    : dateStatus === 'today'
                      ? 'text-amber-500'
                      : 'text-slate-450 dark:text-slate-500'
              }`}
            >
              {dateStatus === 'overdue' && !isCompleted ? (
                <AlertCircle size={11} className="animate-pulse" />
              ) : (
                <Calendar size={11} />
              )}
              <span>{formatDate(dueDate)}</span>
            </div>
          ) : (
            <span className="text-slate-350 dark:text-slate-650 italic text-[9px]">No deadline</span>
          )}

          {/* Task Assignee Avatar */}
          {assignedTo && (
            <div 
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 overflow-hidden max-w-[120px]"
              title={`Assigned to: ${assignedTo.name || assignedTo}`}
            >
              <div className="h-4.5 w-4.5 rounded-full bg-primary-500 text-white flex items-center justify-center font-extrabold text-[8px] uppercase">
                {assignedTo.name ? assignedTo.name[0] : 'U'}
              </div>
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-450 truncate capitalize">
                {assignedTo.name ? assignedTo.name.split(' ')[0] : 'User'}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 lg:group-hover:opacity-100 md:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-lg text-slate-450 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Edit / Comments"
          >
            <Edit3 size={13} />
          </button>
          
          <button
            onClick={() => onDelete(_id)}
            className="p-1 rounded-lg text-slate-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
            title="Delete Task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
