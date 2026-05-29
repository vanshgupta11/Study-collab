import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Session must be linked to a room']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must be linked to a user']
    },
    startTime: {
      type: Date,
      required: [true, 'Session must have a start time'],
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to automatically calculate duration in seconds when endTime is set
sessionSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const start = new Date(this.startTime).getTime();
    const end = new Date(this.endTime).getTime();
    
    if (end >= start) {
      this.duration = Math.round((end - start) / 1000);
    }
  }
  next();
});

// Indexes for query performance
sessionSchema.index({ userId: 1 });
sessionSchema.index({ roomId: 1 });
sessionSchema.index({ startTime: -1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
