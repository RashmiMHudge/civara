import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  societyCode: {
    type: String,
    required: true,
    index: true,
  },
  guard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  guardId: {
    type: String,
    required: false
  },
  guardName: {
    type: String,
    required: false
  },
  gate: String,
  shiftType: String, // Morning, Night, etc.
  date: {
    type: String,
    required: true
  },
  startTime: String,
  endTime: String,
  required: {
    type: Number,
    default: 1
  },
  assignedGuards: [
    {
      guardId: String,
      guardName: String
    }
  ],
  status: {
    type: String,
    enum: ["Planned", "Active", "Completed"],
    default: "Planned"
  }
}, { timestamps: true });

export default mongoose.model("Shift", shiftSchema);