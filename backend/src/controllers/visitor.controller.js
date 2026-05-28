import Visitor from "../models/Visitor.js";
import User from "../models/User.js";

const generateInviteCode = () =>
  Math.floor(1000000 + Math.random() * 900000).toString();

export const createVisitor = async (req, res) => {
  try {
    const { visitorName, phone, purpose, visitDate, fromTime, toTime } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(visitDate);
    if (selectedDate < today) {
      return res.status(400).json({ message: "Visit date cannot be in the past" });
    }

    const resident = await User.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    if(!/^[6-9]\d{9}$/.test(phone)){
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    
    const inviteCode = generateInviteCode();
    const visitor = await Visitor.create({
      resident: {
        id: resident._id,
        name: resident.name,
        block: resident.block,
        flat: resident.flat
      },
      visitorName,
      phone,
      purpose,
      visitDate,
      fromTime,
      toTime,
      inviteCode,
      source: "RESIDENT_INVITE"
    });
    
    res.status(201).json(visitor);
  } catch (error) {
    console.error("Error creating visitor:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createWalkInVisitorRequest = async (req, res) => {
  try {
    const {
      visitorName,
      phone,
      purpose,
      visitType,
      residentFlat,
      residentBlock,
      notes
    } = req.body;

    const cleanVisitorName = String(visitorName || "").trim();
    const cleanPurpose = String(purpose || "").trim();
    const cleanFlat = String(residentFlat || "").trim();
    const cleanBlock = String(residentBlock || "").trim();
    const cleanPhone = String(phone || "").trim();
    const normalizedVisitType = String(visitType || "OTHER").trim().toUpperCase();

    if (!cleanVisitorName || !cleanPurpose || !cleanFlat) {
      return res.status(400).json({
        message: "Visitor name, purpose, and resident flat are required"
      });
    }

    const residentQuery = {
      role: "resident",
      flat: cleanFlat
    };

    if (cleanBlock) {
      residentQuery.block = cleanBlock;
    }

    const resident = await User.findOne(residentQuery);

    if (!resident) {
      return res.status(404).json({
        message: "Resident not found for the provided block and flat"
      });
    }

    const now = new Date();
    const visitor = await Visitor.create({
      resident: {
        id: resident._id,
        name: resident.name,
        block: resident.block,
        flat: resident.flat,
        phone: resident.phone
      },
      visitorName: cleanVisitorName,
      phone: cleanPhone,
      purpose: cleanPurpose,
      visitDate: now,
      fromTime: "",
      toTime: "",
      inviteCode: generateInviteCode(),
      source: "SECURITY_REQUEST",
      visitType: ["GUEST", "DELIVERY", "SERVICE", "OTHER"].includes(normalizedVisitType)
        ? normalizedVisitType
        : "OTHER",
      status: "PENDING_APPROVAL",
      securityRequest: {
        requestedBy: req.user.id,
        requestedByName: req.user.name,
        gate: req.user.guardId || "Main Gate",
        notes: String(notes || "").trim(),
        requestedAt: now
      }
    });

    return res.status(201).json(visitor);
  } catch (error) {
    console.error("Error creating walk-in visitor request:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const respondToVisitorRequest = async (req, res) => {
  try {
    const { decision } = req.body;
    const normalizedDecision = String(decision || "").trim().toUpperCase();

    if (!["APPROVED", "DENIED"].includes(normalizedDecision)) {
      return res.status(400).json({ message: "Decision must be APPROVED or DENIED" });
    }

    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    if (visitor.resident.id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your visitor request" });
    }

    if (visitor.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ message: "This visitor request is no longer pending" });
    }

    visitor.status = normalizedDecision;
    visitor.approvedBy = req.user.id;
    visitor.residentDecisionAt = new Date();
    await visitor.save();

    return res.json({
      message:
        normalizedDecision === "APPROVED"
          ? "Visitor approved successfully"
          : "Visitor denied successfully",
      visitor
    });
  } catch (error) {
    console.error("Error responding to visitor request:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateVisitorStatus = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const nextStatus = String(req.body.status || "").trim().toUpperCase();

    if (
      nextStatus === "CHECKED_IN" &&
      !["EXPECTED", "APPROVED"].includes(String(visitor.status || "").toUpperCase())
    ) {
      return res.status(400).json({
        message: "Visitor can only be checked in after approval"
      });
    }

    visitor.status = nextStatus;
    if (nextStatus === "CHECKED_IN") {
      visitor.checkInTime = new Date();
    }
    if (nextStatus === "CHECKED_OUT") {
      visitor.checkOutTime = new Date();
    }
    if (nextStatus === "APPROVED") {
      visitor.approvedBy = req.user.id;
    }
    await visitor.save();
    res.json(visitor);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      "resident.id": req.user.id
    }).sort({ createdAt: -1 });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let visitor of visitors) {
      const visitDate = new Date(visitor.visitDate);
      visitDate.setHours(0, 0, 0, 0);

      if (
        ["EXPECTED", "PENDING_APPROVAL"].includes(visitor.status) &&
        visitDate < today
      ) {
        visitor.status = "EXPIRED";
        await visitor.save();
      }
    }
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });  
    res.json(visitors);
    } catch (error) {
    res.status(500).json({ message: "Server error" });
    }
};
