import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    societyCode: {
      type: String,
      required: true
    },
    
    resident: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      flat: String,
      phone: String
    },

    type: {
      type: String,
      enum: ["SOS", "MEDICAL", "SUSPICIOUS", "FIRE"],
      required: true
    },
    location: {
      lat: Number,
      lng: Number
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "CRITICAL"],
      default: "CRITICAL"
    },
    description: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED"],
      default: "ACTIVE"
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    resolvedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Emergency", emergencySchema);