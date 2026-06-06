import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { notifyProjectChange, notifyUser } from '../config/socket.js';

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects where user is owner or member
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user._id,
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @route   POST /api/projects
// @desc    Create a new group project with name, description, and optional initial members (emails)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, members: emails } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const memberIds = [req.user._id];
    const invitedUsers = [];

    // Parse and resolve emails if provided during creation
    if (emails && Array.isArray(emails)) {
      for (const email of emails) {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail && trimmedEmail !== req.user.email) {
          const userFound = await User.findOne({ email: trimmedEmail });
          if (userFound) {
            if (!memberIds.includes(userFound._id)) {
              memberIds.push(userFound._id);
              invitedUsers.push(userFound);
            }
          }
        }
      }
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: memberIds,
    });

    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    // Create notifications for initially added members
    for (const invitedUser of invitedUsers) {
      const notif = await Notification.create({
        user: invitedUser._id,
        sender: req.user._id,
        type: 'project_invite',
        project: project._id,
        message: `${req.user.name} invited you to join the project workspace: "${project.name}"`,
      });

      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'name email')
        .populate('project', 'name');

      notifyUser(invitedUser._id, 'notification_received', populatedNotif);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @route   POST /api/projects/:id/invite
// @desc    Invite a user to a project by email lookup
// @access  Private
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Invitee email is required' });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      members: req.user._id, // User inviting must be a member of this project
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    // Find user to invite
    const invitee = await User.findOne({ email: email.trim().toLowerCase() });
    if (!invitee) {
      return res.status(404).json({ message: 'No registered user found with that email' });
    }

    // Check if user is already a member
    if (project.members.includes(invitee._id)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    // Add user and save
    project.members.push(invitee._id);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    // Create and emit notification to the invited user
    const notif = await Notification.create({
      user: invitee._id,
      sender: req.user._id,
      type: 'project_invite',
      project: project._id,
      message: `${req.user.name} invited you to join the project workspace: "${project.name}"`,
    });

    const populatedNotif = await Notification.findById(notif._id)
      .populate('sender', 'name email')
      .populate('project', 'name');

    notifyUser(invitee._id, 'notification_received', populatedNotif);

    // Notify all active project members in real-time
    notifyProjectChange(project._id, 'project_updated', {
      message: `${invitee.name} joined the project workspace!`,
      project: updatedProject,
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Server error inviting member' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project and remove all associated tasks
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user._id, // Only project creators can delete
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ projectId: project._id });

    // Delete the project itself
    await Project.deleteOne({ _id: project._id });

    // Notify members via socket
    notifyProjectChange(project._id, 'project_deleted', {
      projectId: project._id,
      message: `Project ${project.name} has been closed by the owner.`,
    });

    res.json({ message: 'Project and associated tasks removed successfully', id: project._id });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

export default router;
