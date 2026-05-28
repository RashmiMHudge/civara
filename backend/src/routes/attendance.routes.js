import express from "express";
import {
  punchIn,
  punchOut,
  getTodayAttendance,
  getAllAttendance,
  getGuardAttendanceHistory
} from "../controllers/attendance.controller.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Security guard punch in/out
router.post("/punch-in", protect, allowRoles("security"), punchIn);
router.post("/punch-out", protect, allowRoles("security"), punchOut);

// Get today's attendance (admin/security)
router.get("/today", protect, getTodayAttendance);
// Get specific guard attendance history (security/admin)
router.get("/guard/:guardId", protect, allowRoles("security", "admin"), getGuardAttendanceHistory);
// Get all attendance (admin)
router.get("/all", protect, allowRoles("admin"), getAllAttendance);

export default router;
