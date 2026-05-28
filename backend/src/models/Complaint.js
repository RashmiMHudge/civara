import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
  event: { type: String, required: true },
  actor: { type: String, required: true }, // RESIDENT / ADMIN / SYSTEM / SECURITY
  meta: { type: Object, default: {} },
  time: { type: Date, default: Date.now }
});

const attachmentSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String
});

const complaintSchema = new mongoose.Schema(
  {
    complaintCode: {
      type: String,
      unique: true
    },

    societyCode: {
      type: String,
      required: true
    },

    resident: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: String,
      block: String,
      flat: String,
      phone: String
    },

    category: {
      type: String,
      required: true
    },

    location: String,

    priority: {
      type: String,
      enum: ["NORMAL", "HIGH", "EMERGENCY"],
      default: "NORMAL"
    },

    description: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "ACKNOWLEDGED",
        "ON_HOLD",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "AWAITING_FEEDBACK",
        "CLOSED",
        "REJECTED"
      ],
      default: "OPEN"
    },

    assignment: {
      assigned: { type: Boolean, default: false },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      role: String,
      assignedAt: Date
    },

    sla: {
      hours: { type: Number, required: true },
      startedAt: Date,
      deadline: Date,
      paused: { type: Boolean, default: false },
      pausedAt: Date,
      pauseReason: { type: String, default: "" },
      totalPausedMs: { type: Number, default: 0 },
      breached: { type: Boolean, default: false }
    },

    automation: {
      callAllowed: { type: Boolean, default: true },
      callStatus: {
        type: String,
        enum: ["PENDING", "SCHEDULED", "COMPLETED", "NO_RESPONSE"],
        default: "PENDING"
      },
      callAttempts: { type: Number, default: 0 },
      preferredCallTime: {
        type: String,
        enum: ["ANYTIME", "MORNING", "AFTERNOON", "EVENING"],
        default: "ANYTIME"
      },
      repeatedIssue: { type: Boolean, default: false },
      availability: { type: String, default: "" },
      callSummary: { type: String, default: "" },
      voiceTranscript: { type: String, default: "" },
      voiceRecordingUrl: { type: String, default: "" },
      residentPreferredSlot: { type: String, default: "" },
      conversationSummary: { type: String, default: "" },
      assignmentSuggestion: { type: String, default: "" },
      prioritySuggestion: { type: String, default: "" },
      noResponseEscalated: { type: Boolean, default: false },
      whatsappEscalated: { type: Boolean, default: false },
      whatsappReply: { type: String, default: "" },
      whatsappReplyAt: { type: Date },
      whatsappMessageSid: { type: String, default: "" },
      adminAlertSent: { type: Boolean, default: false },
      adminAlertReason: { type: String, default: "" },
      adminAlertedAt: { type: Date },
      nextCallAt: { type: Date }
    },

    attachments: [attachmentSchema],

    timeline: [timelineSchema],

    feedback: {
      eligible: { type: Boolean, default: false },
      submitted: { type: Boolean, default: false },
      rating: Number,
      comment: String,
      submittedAt: { type: Date }
    },

    resolvedAt: Date
  },
  { timestamps: true }
);




export default mongoose.model("Complaint", complaintSchema);
