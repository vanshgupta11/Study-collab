import mongoose from 'mongoose';

// Utility function to generate a random 6-character alphanumeric string (uppercase)
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a room name'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    inviteCode: {
      type: String,
      unique: true,
      trim: true,
      minlength: 6,
      maxlength: 6
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure inviteCode is generated before validation
roomSchema.pre('validate', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
  next();
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
