export const securityLogin = async (req, res) => {
  try {
    const { guardId, password } = req.body;
    if (!guardId || !password) {
      return res.status(400).json({ message: "Missing guardId or password" });
    }
    const guard = await User.findOne({ role: "security", guardId });
    if (!guard) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, guard.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: guard._id, role: guard.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      guard: {
        guardId: guard.guardId,
        name: guard.name,
        email: guard.email,
        phone: guard.phone,
        gate: guard.gate || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { role, societyCode, email, password } = req.body;

    if (!role || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ role, email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, 
        role: user.role ,
        societyCode: user.societyCode
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    let redirect = "/";
    if (role === "admin") redirect = "/admin/dashboard";
    if (role === "resident") redirect = "/resident/dashboard";
    if (role === "security") redirect = "/security/dashboard";

    res.json({
      token,
      role: user.role,
      redirect,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
