import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Message must belong to a room']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender']
    },
    text: {
      type: String,
      required: [true, 'Message text cannot be empty'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index on roomId and createdAt to fetch chat history efficiently
messageSchema.index({ roomId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
