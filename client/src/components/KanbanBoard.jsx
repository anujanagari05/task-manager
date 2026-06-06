import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Clock, CheckCircle2 } from 'lucide-react';

const KanbanBoard = ({ tasks = [], onToggleStatus, onEdit, onDelete }) => {
  const [activeDragId, setActiveDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDragId(task._id);
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || activeDragId;
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== targetStatus) {
      onToggleStatus(taskId, task.status);
    }

    setActiveDragId(null);
    setDragOverCol(null);
  };

  const columns = [
    {
      id: 'pending',
      title: 'Active Workload',
      tasks: pendingTasks,
      color: 'border-t-4 border-amber-500 bg-amber-550/5',
      icon: Clock,
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'completed',
      title: 'Completed Tasks',
      tasks: completedTasks,
      color: 'border-t-4 border-emerald-500 bg-emerald-550/5',
      icon: CheckCircle2,
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
      {columns.map((col) => {
        const Icon = col.icon;
        const isOver = dragOverCol === col.id;
        return (
          <div 
            key={col.id} 
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`glass-panel p-5 rounded-3xl border flex flex-col h-full min-h-[480px] transition-all duration-300 ${col.color} ${
              isOver 
                ? 'border-primary-500/50 bg-primary-500/10 scale-[1.01] ring-2 ring-primary-500/20' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40 mb-5">
              <div className="flex items-center space-x-2.5">
                <Icon className={col.textColor} size={18} />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white tracking-wide">{col.title}</h3>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {col.tasks.length}
              </span>
            </div>

            {/* Task Cards Stack */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
              {col.tasks.length === 0 ? (
                <div className="py-20 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center space-y-2">
                  <Icon size={28} className="opacity-30 stroke-[1.5]" />
                  <p className="text-xs font-semibold italic">No tasks in this column.</p>
                </div>
              ) : (
                col.tasks.map((task) => (
                  <div 
                    key={task._id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={`group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      activeDragId === task._id ? 'opacity-40 scale-98' : ''
                    }`}
                  >
                    <TaskCard
                      task={task}
                      onToggleStatus={onToggleStatus}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;

