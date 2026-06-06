import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true, // Generate standard subdocument IDs for comments to allow deletion if needed
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // The task creator
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null, // Null indicates personal task, otherwise associated to a project board
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Can be assigned to project members
    },
    comments: [commentSchema], // Discussions feed
  },
  {
    timestamps: true,
  }
);

// Populate completedAt automatically if status changes to completed
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = new Date();
    } else {
      this.completedAt = undefined;
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
