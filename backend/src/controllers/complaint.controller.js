// ===============================
// ADMIN ANALYTICS ENDPOINTS
// ===============================
export const getComplaintTrend = async (req, res) => {
  try {
    // Last 7 days: [{ day: 'Mon', complaints: 2 }, ...]
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const today = new Date();
    let trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      const count = await Complaint.countDocuments({
        createdAt: { $gte: start, $lte: end },
        societyCode: req.user.societyCode
      });
      trend.push({ day: days[start.getDay()], complaints: count });
    }
    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: "Error fetching trend" });
  }
};

export const getComplaintCategoryBreakdown = async (req, res) => {
  try {
    // [{ name: 'Water Leakage', value: 4 }, ...]
    const pipeline = [
      { $match: { societyCode: req.user.societyCode } },
      { $group: { _id: "$category", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ];
    const result = await Complaint.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching category breakdown" });
  }
};

export const getComplaintSLAStats = async (req, res) => {
  try {
    // { total: X, breached: Y, onTrack: Z }
    const all = await Complaint.find({ societyCode: req.user.societyCode });
    let breached = 0, onTrack = 0;
    all.forEach(c => {
      if (c.sla && c.sla.deadline && c.status !== "RESOLVED" && new Date() > c.sla.deadline) breached++;
      else onTrack++;
    });
    res.json({ total: all.length, breached, onTrack });
  } catch (err) {
    res.status(500).json({ message: "Error fetching SLA stats" });
  }
};
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import axios from "axios";
import { generateComplaintId } from "../utils/generateComplaintId.js";
import { normalizeIndianPhone } from "../utils/phone.js";

const getN8nWebhookBaseUrl = () =>
  (process.env.N8N_WEBHOOK_BASE_URL || "http://localhost:5678/webhook").replace(/\/$/, "");

const getAutomationWebhookSecret = () => process.env.AUTOMATION_WEBHOOK_SECRET || "";

const webhookUrl = (name) => `${getN8nWebhookBaseUrl()}/${name}`;

const VALID_CALL_STATUSES = new Set(["PENDING", "SCHEDULED", "COMPLETED", "NO_RESPONSE"]);
const VALID_PRIORITIES = new Set(["NORMAL", "HIGH", "EMERGENCY"]);
const SLA_PAUSE_AVAILABILITY = new Set(["OUT_OF_TOWN", "UNAVAILABLE", "NOT_AVAILABLE"]);
const SLA_RESUME_AVAILABILITY = new Set(["AVAILABLE", "AVAILABLE_AT_SLOT", "IN_TOWN"]);
const CLOSED_COMPLAINT_STATUSES = new Set(["RESOLVED", "CLOSED", "REJECTED"]);

const normalizeTimelineMeta = (meta) => {
  if (!meta || typeof meta !== "object") return "";
  return JSON.stringify(meta);
};

const pushTimelineEventOnce = (complaint, event, actor, meta = {}) => {
  const lastEvent = complaint.timeline?.[complaint.timeline.length - 1];
  if (
    lastEvent &&
    lastEvent.event === event &&
    lastEvent.actor === actor &&
    normalizeTimelineMeta(lastEvent.meta) === normalizeTimelineMeta(meta)
  ) {
    return false;
  }

  complaint.timeline.push({
    event,
    actor,
    meta,
    time: new Date()
  });

  return true;
};

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeAutomationAvailability = (value) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, "_");

const extractPreferredSlotFromText = (text) => {
  const message = String(text || "").replace(/\s+/g, " ").trim();
  if (!message) return "";

  const slotPatterns = [
    /\b(?:available|free)\s+(?:at|after|from)\s+([^.,;]+)/i,
    /\b(?:available|free)\s+(tomorrow[^.,;]*)/i,
    /\b(?:available|free)\s+(today[^.,;]*)/i,
    /\b(?:tomorrow|today)\s+(?:at\s+)?([^.,;]+)/i,
    /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\b(?:\s*(?:tomorrow|today))?/i
  ];

  for (const pattern of slotPatterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const extracted = (match[1] || match[0] || "").trim();
    if (extracted) return extracted;
  }

  return "";
};

const inferAvailabilityFromText = (text, preferredSlot) => {
  const message = String(text || "").toLowerCase();

  if (/\b(out of town|not available|unavailable)\b/.test(message)) {
    return "UNAVAILABLE";
  }

  if (preferredSlot) {
    return "AVAILABLE_AT_SLOT";
  }

  if (/\bavailable\b|\bfree\b/.test(message)) {
    return "AVAILABLE";
  }

  return "";
};

const applyAvailabilityToSLA = (complaint, rawAvailability) => {
  const availability = normalizeAutomationAvailability(rawAvailability);
  if (!availability || !complaint.sla) return;

  if (SLA_PAUSE_AVAILABILITY.has(availability)) {
    if (!complaint.sla.paused) {
      complaint.sla.paused = true;
      complaint.sla.pausedAt = new Date();
      complaint.sla.pauseReason = availability;
      pushTimelineEventOnce(complaint, "SLA_PAUSED", "SYSTEM", {
        reason: availability
      });
    }
    return;
  }

  if (SLA_RESUME_AVAILABILITY.has(availability) && complaint.sla.paused) {
    const resumedAt = new Date();
    const pausedAt = complaint.sla.pausedAt ? new Date(complaint.sla.pausedAt) : resumedAt;
    const pausedMs = Math.max(0, resumedAt.getTime() - pausedAt.getTime());

    complaint.sla.totalPausedMs = (complaint.sla.totalPausedMs || 0) + pausedMs;
    if (complaint.sla.deadline) {
      complaint.sla.deadline = new Date(new Date(complaint.sla.deadline).getTime() + pausedMs);
    }

    complaint.sla.paused = false;
    complaint.sla.pausedAt = undefined;
    complaint.sla.pauseReason = "";
    pushTimelineEventOnce(complaint, "SLA_RESUMED", "SYSTEM", {
      availability,
      pausedMinutes: Math.round(pausedMs / 60000)
    });
  }
};

const getResumedComplaintStatus = (complaint) => {
  if (complaint.assignment?.assigned) {
    return complaint.status === "IN_PROGRESS" ? "IN_PROGRESS" : "ASSIGNED";
  }

  return "ACKNOWLEDGED";
};

const applyAutomationUpdate = async (complaint, payload, options = {}) => {
  const { triggerNoResponseWebhook = true } = options;
  const {
    callStatus,
    priority,
    callAttempts,
    callSummary,
    voiceTranscript,
    voiceRecordingUrl,
    residentPreferredSlot,
    conversationSummary,
    assignmentSuggestion,
    prioritySuggestion,
    availability,
    nextCallAt,
    whatsappEscalated,
    noResponseEscalated,
    whatsappReply,
    whatsappReplyAt,
    whatsappMessageSid,
    adminAlertSent,
    adminAlertReason,
    adminAlertedAt
  } = payload;

  const previousAutomationState = {
    callStatus: complaint.automation.callStatus,
    callAttempts: complaint.automation.callAttempts,
    callSummary: complaint.automation.callSummary,
    voiceTranscript: complaint.automation.voiceTranscript,
    voiceRecordingUrl: complaint.automation.voiceRecordingUrl,
    residentPreferredSlot: complaint.automation.residentPreferredSlot,
    conversationSummary: complaint.automation.conversationSummary,
    assignmentSuggestion: complaint.automation.assignmentSuggestion,
    prioritySuggestion: complaint.automation.prioritySuggestion,
    availability: complaint.automation.availability,
    nextCallAt: complaint.automation.nextCallAt
      ? new Date(complaint.automation.nextCallAt).toISOString()
      : "",
    whatsappEscalated: complaint.automation.whatsappEscalated,
    noResponseEscalated: complaint.automation.noResponseEscalated,
    whatsappReply: complaint.automation.whatsappReply,
    whatsappReplyAt: complaint.automation.whatsappReplyAt
      ? new Date(complaint.automation.whatsappReplyAt).toISOString()
      : "",
    whatsappMessageSid: complaint.automation.whatsappMessageSid,
    adminAlertSent: complaint.automation.adminAlertSent,
    adminAlertReason: complaint.automation.adminAlertReason,
    adminAlertedAt: complaint.automation.adminAlertedAt
      ? new Date(complaint.automation.adminAlertedAt).toISOString()
      : ""
  };
  const previousComplaintStatus = complaint.status;

  if (callStatus) {
    const normalizedCallStatus = String(callStatus).trim().toUpperCase();
    if (!VALID_CALL_STATUSES.has(normalizedCallStatus)) {
      throw createHttpError(400, `Invalid callStatus. Expected one of ${Array.from(VALID_CALL_STATUSES).join(", ")}`);
    }
    complaint.automation.callStatus = normalizedCallStatus;
  }
  if (typeof callAttempts === "number") complaint.automation.callAttempts = callAttempts;
  if (priority) {
    const normalizedPriority = String(priority).trim().toUpperCase();
    if (!VALID_PRIORITIES.has(normalizedPriority)) {
      throw createHttpError(400, `Invalid priority. Expected one of ${Array.from(VALID_PRIORITIES).join(", ")}`);
    }
    if (complaint.priority !== normalizedPriority) {
      pushTimelineEventOnce(complaint, "PRIORITY_CHANGED", "SYSTEM", {
        from: complaint.priority,
        to: normalizedPriority,
        reason: adminAlertReason || "Automation update"
      });
      complaint.priority = normalizedPriority;
    }
  }
  if (typeof callSummary === "string") complaint.automation.callSummary = callSummary;
  if (typeof voiceTranscript === "string") complaint.automation.voiceTranscript = voiceTranscript;
  if (typeof voiceRecordingUrl === "string") complaint.automation.voiceRecordingUrl = voiceRecordingUrl;
  if (typeof residentPreferredSlot === "string") complaint.automation.residentPreferredSlot = residentPreferredSlot;
  if (typeof conversationSummary === "string") complaint.automation.conversationSummary = conversationSummary;
  if (typeof assignmentSuggestion === "string") complaint.automation.assignmentSuggestion = assignmentSuggestion;
  if (typeof prioritySuggestion === "string") complaint.automation.prioritySuggestion = prioritySuggestion;
  if (availability) {
    complaint.automation.availability = normalizeAutomationAvailability(availability);
    applyAvailabilityToSLA(complaint, availability);

    if (
      SLA_PAUSE_AVAILABILITY.has(complaint.automation.availability) &&
      !CLOSED_COMPLAINT_STATUSES.has(complaint.status)
    ) {
      complaint.status = "ON_HOLD";
    }

    if (
      SLA_RESUME_AVAILABILITY.has(complaint.automation.availability) &&
      complaint.status === "ON_HOLD"
    ) {
      complaint.status = getResumedComplaintStatus(complaint);
    }
  }
  if (nextCallAt) complaint.automation.nextCallAt = new Date(nextCallAt);
  if (typeof whatsappEscalated === "boolean") complaint.automation.whatsappEscalated = whatsappEscalated;
  if (typeof noResponseEscalated === "boolean") complaint.automation.noResponseEscalated = noResponseEscalated;
  if (typeof whatsappReply === "string") complaint.automation.whatsappReply = whatsappReply;
  if (whatsappReplyAt) complaint.automation.whatsappReplyAt = new Date(whatsappReplyAt);
  if (typeof whatsappMessageSid === "string") complaint.automation.whatsappMessageSid = whatsappMessageSid;
  if (typeof adminAlertSent === "boolean") complaint.automation.adminAlertSent = adminAlertSent;
  if (typeof adminAlertReason === "string") complaint.automation.adminAlertReason = adminAlertReason;
  if (adminAlertedAt) complaint.automation.adminAlertedAt = new Date(adminAlertedAt);

  if (typeof adminAlertSent === "boolean" && adminAlertSent) {
    if (!complaint.automation.adminAlertedAt) {
      complaint.automation.adminAlertedAt = new Date();
    }
    pushTimelineEventOnce(complaint, "ADMIN_ALERT_SENT", "SYSTEM", {
      reason: complaint.automation.adminAlertReason || "AUTOMATION_EVENT"
    });
  }

  if (typeof conversationSummary === "string" && conversationSummary.trim()) {
    pushTimelineEventOnce(complaint, "CALL_SUMMARY_CAPTURED", "SYSTEM", {
      preferredSlot: complaint.automation.residentPreferredSlot || "",
      hasTranscript: Boolean(complaint.automation.voiceTranscript),
      assignmentSuggestion: complaint.automation.assignmentSuggestion || "",
      prioritySuggestion: complaint.automation.prioritySuggestion || ""
    });

    if (!complaint.automation.adminAlertSent) {
      complaint.automation.adminAlertSent = true;
      complaint.automation.adminAlertReason = "CALL_SUMMARY_READY";
      complaint.automation.adminAlertedAt = new Date();
      pushTimelineEventOnce(complaint, "ADMIN_ALERT_SENT", "SYSTEM", {
        reason: "CALL_SUMMARY_READY"
      });
    }
  }

  if (typeof whatsappReply === "string" && whatsappReply.trim()) {
    pushTimelineEventOnce(complaint, "WHATSAPP_REPLY_RECEIVED", "RESIDENT", {
      messagePreview: whatsappReply.trim().slice(0, 140)
    });
  }

  if (complaint.automation.callStatus === "COMPLETED" && complaint.status === "OPEN") {
    complaint.status = "ACKNOWLEDGED";
  }

  const currentAutomationState = {
    callStatus: complaint.automation.callStatus,
    callAttempts: complaint.automation.callAttempts,
    callSummary: complaint.automation.callSummary,
    voiceTranscript: complaint.automation.voiceTranscript,
    voiceRecordingUrl: complaint.automation.voiceRecordingUrl,
    residentPreferredSlot: complaint.automation.residentPreferredSlot,
    conversationSummary: complaint.automation.conversationSummary,
    assignmentSuggestion: complaint.automation.assignmentSuggestion,
    prioritySuggestion: complaint.automation.prioritySuggestion,
    availability: complaint.automation.availability,
    nextCallAt: complaint.automation.nextCallAt
      ? new Date(complaint.automation.nextCallAt).toISOString()
      : "",
    whatsappEscalated: complaint.automation.whatsappEscalated,
    noResponseEscalated: complaint.automation.noResponseEscalated,
    whatsappReply: complaint.automation.whatsappReply,
    whatsappReplyAt: complaint.automation.whatsappReplyAt
      ? new Date(complaint.automation.whatsappReplyAt).toISOString()
      : "",
    whatsappMessageSid: complaint.automation.whatsappMessageSid,
    adminAlertSent: complaint.automation.adminAlertSent,
    adminAlertReason: complaint.automation.adminAlertReason,
    adminAlertedAt: complaint.automation.adminAlertedAt
      ? new Date(complaint.automation.adminAlertedAt).toISOString()
      : ""
  };

  const automationChanged =
    JSON.stringify(previousAutomationState) !== JSON.stringify(currentAutomationState);

  if (automationChanged) {
    pushTimelineEventOnce(complaint, "AUTOMATION_UPDATED", "SYSTEM", {
      callStatus: complaint.automation.callStatus,
      callAttempts: complaint.automation.callAttempts,
      availability: complaint.automation.availability,
      assignmentSuggestion: complaint.automation.assignmentSuggestion || "",
      prioritySuggestion: complaint.automation.prioritySuggestion || ""
    });
  }

  if (previousComplaintStatus !== complaint.status) {
    pushTimelineEventOnce(complaint, "STATUS_CHANGED", "SYSTEM", {
      from: previousComplaintStatus,
      to: complaint.status,
      reason: "Automation call completed"
    });
  }

  if (
    complaint.automation.callStatus === "NO_RESPONSE" &&
    complaint.automation.callAttempts >= 3 &&
    previousAutomationState.noResponseEscalated !== true
  ) {
    complaint.automation.noResponseEscalated = true;
    complaint.automation.adminAlertSent = true;
    complaint.automation.adminAlertReason = "NO_RESPONSE_AFTER_3_ATTEMPTS";
    complaint.automation.adminAlertedAt = new Date();
    pushTimelineEventOnce(complaint, "NO_RESPONSE_ESCALATED", "SYSTEM", {
      attempts: complaint.automation.callAttempts
    });
    pushTimelineEventOnce(complaint, "ADMIN_ALERT_SENT", "SYSTEM", {
      reason: "NO_RESPONSE_AFTER_3_ATTEMPTS"
    });

    if (triggerNoResponseWebhook) {
      try {
        await axios.post(webhookUrl("complaint-no-response"), {
          complaintId: complaint._id,
          complaintCode: complaint.complaintCode,
          residentPhone: normalizeIndianPhone(complaint.resident?.phone),
          attempts: complaint.automation.callAttempts
        });
      } catch (err) {
        console.log("n8n no-response webhook not running");
      }
    }
  }

  await complaint.save();
  return complaint;
};

/* =====================================================
    RESIDENT - CREATE COMPLAINT
===================================================== */
export const createComplaint = async (req, res) => {
  try {
    const {
      category,
      location,
      priority,
      description,
      preferredCallTime
    } = req.body;

    const resident = await User.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    /* =============================
       REPEATED ISSUE DETECTION
    ============================== */
    const lastComplaint = await Complaint.findOne({
      "resident.id": resident._id,
      category,
      location,
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      status: { $ne: "REJECTED" }
    }).sort({ createdAt: -1 });

    /* =============================
       SLA CALCULATION
    ============================== */
    const slaHours =
      priority === "EMERGENCY"
        ? 6
        : priority === "HIGH"
        ? 24
        : 48;

    const startedAt = new Date();
    const deadline = new Date(
      startedAt.getTime() + slaHours * 60 * 60 * 1000
    );

    /* =============================
       FILE HANDLING 
    ============================== */
    const files = req.files || [];
    let attachments = [];

    if (files.length > 0) {
      attachments = files.map(file => ({
        name: file.originalname,
        type: file.mimetype,
        url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      }));
    }

    /* =============================
       CREATE COMPLAINT
    ============================== */
    const complaint = await Complaint.create({
      societyCode: resident.societyCode,
      
      complaintCode:generateComplaintId(),

      status:"OPEN",
      resident: {
        id: resident._id,
        name: resident.name,
        block: resident.block || "",
        flat: resident.flat || "",
        phone: normalizeIndianPhone(resident.phone)
      },

      category,
      location,
      priority,
      description,
      attachments,

      sla: {
        hours: slaHours,
        startedAt,
        deadline
      },

      automation: {
        preferredCallTime,
        repeatedIssue: lastComplaint ? true : false
      },

      timeline: [
        {
          event: "COMPLAINT_RAISED",
          actor: "RESIDENT",
          time:new Date(),
        }
      ]
    });

    /* =============================
       REPEATED ISSUE MARK
    ============================== */
    if (lastComplaint) {
      complaint.timeline.push({
        event: "REPEATED_ISSUE_DETECTED",
        actor: "SYSTEM",
        time: new Date()
      });

      await complaint.save();
    }

    /* =============================
       AUTOMATION TRIGGER (n8n)
    ============================== */
    try {
      await axios.post(webhookUrl("complaint-created"), {
        complaintId: complaint._id,
        complaintCode: complaint.complaintCode,
        phone: normalizeIndianPhone(resident.phone),
        name: resident.name,
        flat: resident.flat || "",
        category,
        location,
        priority,
        description,
        repeatedIssue: complaint.automation.repeatedIssue,
        preferredCallTime
      });
    } catch (err) {
      console.log(" n8n not running yet");
    }

    res.status(201).json(complaint);

  } catch (error) {
    console.error("Create Complaint Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
    RESIDENT - GET MY COMPLAINTS
===================================================== */
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      "resident.id": req.user.id,
      societyCode: req.user.societyCode
    }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error("Get My Complaints Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    ADMIN - GET ALL COMPLAINTS
===================================================== */
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      societyCode: req.user.societyCode
    }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

/* =====================================================
    GET COMPLAINT BY ID
===================================================== */
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    if (complaint.societyCode !== req.user.societyCode) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(complaint);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

/* =====================================================
    ADMIN - ASSIGN COMPLAINT
===================================================== */
export const assignComplaint = async (req, res) => {
  try {
    const { staffId, role, name } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignment = {
      assigned: true,
      assignedTo: staffId,
      name: String(name || "").trim(),
      role,
      assignedAt: new Date()
    };

    complaint.status = "ASSIGNED";

    complaint.timeline.push({
      event: "COMPLAINT_ASSIGNED",
      actor: "ADMIN",
      meta: { staffId, role, name: String(name || "").trim() }
    });

    await complaint.save();

    res.json(complaint);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

/* =====================================================
    ADMIN - RESOLVE COMPLAINT
===================================================== */
export const resolveComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = "RESOLVED";
    complaint.resolvedAt = new Date();

    complaint.feedback.eligible = true;

    complaint.timeline.push({
      event: "COMPLAINT_RESOLVED",
      actor: "ADMIN"
    });

    await complaint.save();

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    ADMIN - CHANGE COMPLAINT STATUS (MANUAL)
===================================================== */
export const changeComplaintStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ["OPEN", "ACKNOWLEDGED", "ON_HOLD", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "AWAITING_FEEDBACK", "CLOSED"];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.societyCode !== req.user.societyCode) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (status === "RESOLVED") {
      complaint.resolvedAt = new Date();
      complaint.feedback.eligible = true;
    }

    complaint.timeline.push({
      event: "STATUS_CHANGED",
      actor: "ADMIN",
      meta: { from: previousStatus, to: status, notes }
    });

    await complaint.save();

    res.json(complaint);
  } catch (error) {
    console.error("Change Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    RESIDENT - SUBMIT FEEDBACK
===================================================== */
export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (!complaint.feedback.eligible) {
      return res.status(400).json({
        message: "Feedback not allowed for this complaint"
      });
    }

    if (complaint.feedback.submitted) {
      return res.status(400).json({
        message: "Feedback already submitted"
      });
    }

    complaint.feedback = {
      eligible: false,
      submitted: true,
      rating,
      comment,
      submittedAt: new Date()
    };

    complaint.status = "CLOSED";

    complaint.timeline.push({
      event: "FEEDBACK_SUBMITTED",
      actor: "RESIDENT",
      meta: { rating }
    });

    complaint.timeline.push({
      event: "COMPLAINT_CLOSED",
      actor: "SYSTEM",
      meta: { reason: "Feedback submitted" }
    });

    await complaint.save();

    res.json({ message: "Feedback submitted and complaint closed successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    RESIDENT / ADMIN - RESCHEDULE COMPLAINT VISIT
===================================================== */
export const rescheduleComplaintVisit = async (req, res) => {
  try {
    const { preferredSlot, notes } = req.body;

    if (!String(preferredSlot || "").trim()) {
      return res.status(400).json({ message: "Preferred visit slot is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.societyCode !== req.user.societyCode) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user.role === "resident" && String(complaint.resident?.id) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only reschedule your own complaints" });
    }

    const actor = req.user.role === "admin" ? "ADMIN" : "RESIDENT";
    const reason = req.user.role === "admin" ? "ADMIN_RESCHEDULED" : "RESIDENT_RESCHEDULED";
    const slot = String(preferredSlot).trim();
    const noteText = String(notes || "").trim();
    const summary = noteText
      ? `Visit rescheduled for ${slot}. Notes: ${noteText}`
      : `Visit rescheduled for ${slot}.`;

    const updated = await applyAutomationUpdate(
      complaint,
      {
        residentPreferredSlot: slot,
        availability: "AVAILABLE_AT_SLOT",
        callStatus: "COMPLETED",
        callSummary: summary,
        adminAlertSent: true,
        adminAlertReason: reason
      },
      { triggerNoResponseWebhook: false }
    );

    pushTimelineEventOnce(updated, "VISIT_RESCHEDULED", actor, {
      preferredSlot: slot,
      notes: noteText
    });

    await updated.save();

    res.json(updated);
  } catch (error) {
    console.error("Reschedule Complaint Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    ADMIN - UPDATE AUTOMATION RESULT (n8n/manual)
===================================================== */
export const updateAutomationResult = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.societyCode !== req.user.societyCode) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await applyAutomationUpdate(complaint, req.body, {
      triggerNoResponseWebhook: true
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    N8N - UPDATE AUTOMATION RESULT (WEBHOOK + SECRET)
===================================================== */
export const updateAutomationFromWebhook = async (req, res) => {
  try {
    const automationWebhookSecret = getAutomationWebhookSecret();

    if (!automationWebhookSecret) {
      return res.status(503).json({ message: "Automation webhook secret is not configured" });
    }

    const providedSecret = req.headers["x-automation-secret"];
    if (providedSecret !== automationWebhookSecret) {
      return res.status(401).json({ message: "Invalid automation webhook secret" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const updated = await applyAutomationUpdate(complaint, req.body, {
      triggerNoResponseWebhook: true
    });

    res.json({ message: "Automation webhook applied", complaint: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    N8N/TWILIO - CAPTURE WHATSAPP REPLY (WEBHOOK + SECRET)
===================================================== */
export const captureWhatsappReplyFromWebhook = async (req, res) => {
  try {
    const automationWebhookSecret = getAutomationWebhookSecret();

    if (!automationWebhookSecret) {
      return res.status(503).json({ message: "Automation webhook secret is not configured" });
    }

    const providedSecret = req.headers["x-automation-secret"];
    if (providedSecret !== automationWebhookSecret) {
      return res.status(401).json({ message: "Invalid automation webhook secret" });
    }

    const complaintId = req.body.complaintId || req.body.complaint_id;
    const complaintCode = req.body.complaintCode || req.body.complaint_code;
    const residentPhone = normalizeIndianPhone(
      req.body.residentPhone || req.body.from || req.body.From || ""
    );
    const replyMessage = (req.body.message || req.body.Body || "").trim();
    const messageSid = req.body.messageSid || req.body.SmsMessageSid || "";

    if (!replyMessage) {
      return res.status(400).json({ message: "reply message is required" });
    }

    let complaint = null;
    if (complaintId) {
      complaint = await Complaint.findById(complaintId);
    }

    if (!complaint && complaintCode) {
      complaint = await Complaint.findOne({ complaintCode });
    }

    if (!complaint && residentPhone) {
      complaint = await Complaint.findOne({
        "resident.phone": residentPhone,
        status: { $nin: ["RESOLVED", "CLOSED", "REJECTED"] }
      }).sort({ createdAt: -1 });
    }

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (messageSid && complaint.automation?.whatsappMessageSid === messageSid) {
      return res.json({ message: "WhatsApp reply already captured", complaint });
    }

    if (messageSid) {
      const claimResult = await Complaint.updateOne(
        {
          _id: complaint._id,
          "automation.whatsappMessageSid": { $ne: messageSid }
        },
        {
          $set: {
            "automation.whatsappMessageSid": messageSid
          }
        }
      );

      if (claimResult.modifiedCount === 0) {
        const existingComplaint = await Complaint.findById(complaint._id);
        return res.json({
          message: "WhatsApp reply already captured",
          complaint: existingComplaint || complaint
        });
      }

      complaint = await Complaint.findById(complaint._id);
    }

    const previousReply = String(complaint.automation?.whatsappReply || "").trim();
    const previousReplyAt = complaint.automation?.whatsappReplyAt
      ? new Date(complaint.automation.whatsappReplyAt)
      : null;
    const isSameReplyBody = previousReply && previousReply === replyMessage;
    const isRecentDuplicate =
      isSameReplyBody &&
      previousReplyAt &&
      Date.now() - previousReplyAt.getTime() < 10 * 60 * 1000;

    if (isRecentDuplicate) {
      return res.json({ message: "WhatsApp reply already captured", complaint });
    }

    const preferredSlot = extractPreferredSlotFromText(replyMessage);
    const availability = inferAvailabilityFromText(replyMessage, preferredSlot);

    const updated = await applyAutomationUpdate(
      complaint,
      {
        callStatus: "COMPLETED",
        whatsappReply: replyMessage,
        whatsappReplyAt: new Date(),
        whatsappMessageSid: messageSid,
        conversationSummary: `Resident replied on WhatsApp: ${replyMessage.slice(0, 200)}`,
        residentPreferredSlot: preferredSlot,
        availability,
        adminAlertSent: true,
        adminAlertReason: "WHATSAPP_REPLY_RECEIVED"
      },
      { triggerNoResponseWebhook: false }
    );

    res.json({ message: "WhatsApp reply captured", complaint: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
