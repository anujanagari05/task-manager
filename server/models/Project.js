import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
      maxlength: [50, 'Project name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-add creator to project members list on creation
projectSchema.pre('save', function (next) {
  if (this.isNew) {
    if (!this.members.includes(this.createdBy)) {
      this.members.push(this.createdBy);
    }
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
