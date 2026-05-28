import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    societyCode: { type: String, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    image: { type: String, default: null },
    priority: {
      type: String,
      enum: ["Emergency", "Important", "Normal"],
      default: "Normal"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);