import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { normalizeIndianPhone } from "../utils/phone.js";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "resident", "security"],
      required: true,
    },
    societyCode: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      set: normalizeIndianPhone,
    },
    guardId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // resident fields
    block: {
      type: String,
    },
    flat: {
      type: String,
    },
    occupancyType: {
      type: String,
      enum: ["OWNER", "TENANT"],
      default: function () {
        return this.role === "resident" ? "OWNER" : undefined;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    maintenanceStatus: {
      type: String,
      enum: ["Pending", "Paid", "Overdue", "pending", "paid", "overdue"],
      default: function () {
        return this.role === "resident" ? "Pending" : undefined;
      },
      set: (value) => {
        if (!value) return value;
        const normalized = value.toString().toLowerCase();
        if (normalized === "paid") return "Paid";
        if (normalized === "pending") return "Pending";
        if (normalized === "overdue") return "Overdue";
        return value;
      },
      get: (value) => {
        if (!value) return value;
        const normalized = value.toString().toLowerCase();
        if (normalized === "paid") return "Paid";
        if (normalized === "pending") return "Pending";
        if (normalized === "overdue") return "Overdue";
        return value;
      },
    },
    documents: [
      {
        type: { type: String },
        number: { type: String },
        verified: { type: Boolean, default: false },
        verification: Date,
      },
    ],
    emergencyContact: {
      name: String,
      relation: String,
      phone: {
        type: String,
        set: normalizeIndianPhone,
      },
    },
    securityStatusMeta: {
      reason: String,
      changedAt: Date,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    societyName: {
      type: String,
      trim: true,
    },
    societyAddress: {
      type: String,
      trim: true,
    },
    societyContact: {
      type: String,
      trim: true,
    },
    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    
  },
  { timestamps: true }
);

// Hash password before saving.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare provided password with stored hash.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
