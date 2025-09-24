import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['event_approved', 'event_rejected', 'event_modified'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  eventName: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
