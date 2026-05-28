import Visitor from "../models/Visitor.js";
import User from "../models/User.js";

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
    
    const inviteCode = Math.floor(1000000 + Math.random() * 900000).toString();
    const visitor = await Visitor.create({
      resident: {
        id: resident._id,
        name: resident.name,
        flat: resident.flat
      },
      visitorName,
      phone,
      purpose,
      visitDate,
      fromTime,
      toTime,
      inviteCode
    });
    
    res.status(201).json(visitor);
  } catch (error) {
    console.error("Error creating visitor:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateVisitorStatus = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    visitor.status = req.body.status;
    if (req.body.status === "CHECKED_IN") {
      visitor.checkInTime = new Date();
    }
    if (req.body.status === "CHECKED_OUT") {
      visitor.checkOutTime = new Date();
    }
    if (req.body.status === "APPROVED") {
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
        visitor.status === "EXPECTED" &&
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