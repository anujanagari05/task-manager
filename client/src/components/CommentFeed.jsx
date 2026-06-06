import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Trash, MessageSquare, Clock } from 'lucide-react';

const CommentFeed = ({ comments = [], onAddComment, onDeleteComment, taskCreatorId }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(text.trim());
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Comments List Section */}
      <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[220px] pr-1 scroll-smooth">
        {comments.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <MessageSquare size={24} className="mx-auto stroke-[1.5] opacity-50" />
            <p className="text-[11px] font-medium italic">No comments posted yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = comment.author?._id === user?._id || comment.author === user?._id;
            const isTaskCreator = taskCreatorId === user?._id;
            const canDelete = isAuthor || isTaskCreator;

            return (
              <div key={comment._id} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30 group">
                {/* Author Avatar */}
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary-400 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-sm flex-shrink-0">
                  {comment.authorName ? comment.authorName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>

                {/* Comment Text & details */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize truncate max-w-[120px]">
                      {comment.authorName}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center">
                      <Clock size={8} className="mr-1" />
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words whitespace-pre-line">
                    {comment.text}
                  </p>
                </div>

                {/* Delete Comment */}
                {canDelete && (
                  <button
                    onClick={() => onDeleteComment(comment._id)}
                    className="p-1 rounded-md text-slate-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-550/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Delete Comment"
                  >
                    <Trash size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Submit box */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
        <input
          type="text"
          placeholder="Write a message or project update..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="p-2.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-550/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all"
        >
          <Send size={14} className="stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};

export default CommentFeed;
