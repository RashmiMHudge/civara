import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  societyCode: {
    type: String,
    required: true,
    index: true,
  },
  guard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  guardId: {
    type: String,
    required: true
  },
  guardName: {
    type: String,
    required: true
  },
  gate: String,
  shift: String,
  date: {
    type: String,
    required: true
  },
  startTime: String,
  endTime: String,
  punchedIn: String, // time string or ISO
  punchedOut: String, // time string or ISO
  status: {
    type: String,
    enum: ["Present", "Late", "Absent"],
    default: "Present"
  }
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);