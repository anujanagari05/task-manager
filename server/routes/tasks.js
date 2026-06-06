import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { notifyProjectChange, notifyUser } from '../config/socket.js';

const router = express.Router();

// Priority mapping for sorting
const priorityWeight = {
  high: 3,
  medium: 2,
  low: 1,
};

// @route   GET /api/tasks
// @desc    Get all tasks for logged in user (supports personal vs project filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, search, sortBy, sortOrder = 'asc', project } = req.query;

    const query = {};

    // Filter by Project Board vs Personal Tasks
    if (project && project !== 'personal') {
      // Make sure user has access to this project
      const hasAccess = await Project.findOne({ _id: project, members: req.user._id });
      if (!hasAccess) {
        return res.status(401).json({ message: 'Unauthorized access to project tasks' });
      }
      query.projectId = project;
    } else {
      // Personal Tasks (where projectId is null)
      query.user = req.user._id;
      query.projectId = null;
    }

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Apply search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch tasks
    let tasks = await Task.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email');

    // Apply JS sorting
    tasks = tasks.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        comparison = new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'priority') {
        comparison = priorityWeight[b.priority] - priorityWeight[a.priority];
      } else {
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a single task by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Validate access: if it's a project task, user must be a member
    if (task.projectId) {
      const project = await Project.findOne({ _id: task.projectId, members: req.user._id });
      if (!project) {
        return res.status(401).json({ message: 'Unauthorized project member access' });
      }
    } else {
      // If personal, creator only
      if (task.user._id.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized task access' });
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Fetch task error:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task (personal or project board)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, priority, dueDate, project, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Build project scope validation
    let targetProject = null;
    if (project && project !== 'personal') {
      const dbProject = await Project.findOne({ _id: project, members: req.user._id });
      if (!dbProject) {
        return res.status(401).json({ message: 'Unauthorized to add tasks to this project' });
      }
      targetProject = project;
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate || undefined,
      user: req.user._id,
      projectId: targetProject,
      assignedTo: assignedTo || null,
    });

    const populated = await Task.findById(task._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    // Create notification if assigned to another user
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        user: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        project: targetProject,
        task: task._id,
        message: `${req.user.name} assigned you the task: "${title}"`,
      });
      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'name email')
        .populate('project', 'name')
        .populate('task', 'title');
      notifyUser(assignedTo, 'notification_received', populatedNotif);
    }

    // Notify other project members via sockets
    if (targetProject) {
      notifyProjectChange(targetProject, 'task_created', {
        task: populated,
        message: `${req.user.name} created a task: "${title}"`,
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const originalAssignee = task.assignedTo ? task.assignedTo.toString() : null;
    const originalStatus = task.status;

    // Validate access
    if (task.projectId) {
      const project = await Project.findOne({ _id: task.projectId, members: req.user._id });
      if (!project) {
        return res.status(401).json({ message: 'Unauthorized project edit access' });
      }
    } else {
      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized personal task edit access' });
      }
    }

    // Apply updates
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    const updatedTask = await task.save();
    
    const populated = await Task.findById(updatedTask._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email');

    // Trigger Notification for Assignee change
    const newAssignee = assignedTo !== undefined ? (assignedTo ? assignedTo.toString() : null) : originalAssignee;
    if (newAssignee && originalAssignee !== newAssignee && newAssignee !== req.user._id.toString()) {
      const notif = await Notification.create({
        user: newAssignee,
        sender: req.user._id,
        type: 'task_assigned',
        project: task.projectId,
        task: task._id,
        message: `${req.user.name} assigned you the task: "${populated.title}"`,
      });
      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'name email')
        .populate('project', 'name')
        .populate('task', 'title');
      notifyUser(newAssignee, 'notification_received', populatedNotif);
    }

    // Trigger Notification for Status change to completed
    if (status === 'completed' && originalStatus !== 'completed' && task.user.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        user: task.user,
        sender: req.user._id,
        type: 'task_status',
        project: task.projectId,
        task: task._id,
        message: `${req.user.name} completed your task: "${populated.title}"`,
      });
      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'name email')
        .populate('project', 'name')
        .populate('task', 'title');
      notifyUser(task.user, 'notification_received', populatedNotif);
    }

    // Notify other project members
    if (task.projectId) {
      notifyProjectChange(task.projectId, 'task_updated', {
        task: populated,
        message: `${req.user.name} updated the task: "${populated.title}"`,
      });
    }

    res.json(populated);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Validate access
    if (task.projectId) {
      const project = await Project.findOne({ _id: task.projectId, members: req.user._id });
      if (!project) {
        return res.status(401).json({ message: 'Unauthorized project delete access' });
      }
    } else {
      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized personal task delete access' });
      }
    }

    await Task.deleteOne({ _id: req.params.id });

    // Notify other project members
    if (task.projectId) {
      notifyProjectChange(task.projectId, 'task_deleted', {
        taskId: req.params.id,
        message: `${req.user.name} removed the task: "${task.title}"`,
      });
    }

    res.json({ message: 'Task removed successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// ==========================================
// COMMENTS SYSTEM SUB-ROUTES (/api/tasks/:id/comments)
// ==========================================

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Validate access
    if (task.projectId) {
      const project = await Project.findOne({ _id: task.projectId, members: req.user._id });
      if (!project) {
        return res.status(401).json({ message: 'Unauthorized to comment on this project task' });
      }
    } else {
      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized to comment on this personal task' });
      }
    }

    // Append comment subdocument
    task.comments.push({
      text: text.trim(),
      author: req.user._id,
      authorName: req.user.name,
    });

    await task.save();

    // Re-fetch populated task to get updated author data
    const populated = await Task.findById(task._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email');

    // Trigger Notification for Comment
    const recipients = new Set();
    if (task.user.toString() !== req.user._id.toString()) {
      recipients.add(task.user.toString());
    }
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      recipients.add(task.assignedTo.toString());
    }

    for (const recipientId of recipients) {
      const notif = await Notification.create({
        user: recipientId,
        sender: req.user._id,
        type: 'task_comment',
        project: task.projectId,
        task: task._id,
        message: `${req.user.name} commented on "${task.title}": "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
      });
      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'name email')
        .populate('project', 'name')
        .populate('task', 'title');
      notifyUser(recipientId, 'notification_received', populatedNotif);
    }

    // Notify project members in real-time
    if (task.projectId) {
      notifyProjectChange(task.projectId, 'task_updated', {
        task: populated,
        message: `${req.user.name} commented on: "${task.title}"`,
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   DELETE /api/tasks/:id/comments/:commentId
// @desc    Delete a comment from a task
// @access  Private
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find target comment
    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Validate access: author or task creator can delete
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isTaskCreator = task.user.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isTaskCreator) {
      return res.status(401).json({ message: 'Unauthorized to delete this comment' });
    }

    // Remove comment and save
    comment.deleteOne();
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email');

    // Broadcast update
    if (task.projectId) {
      notifyProjectChange(task.projectId, 'task_updated', {
        task: populated,
        message: `${req.user.name} removed a comment.`,
      });
    }

    res.json(populated);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

export default router;
