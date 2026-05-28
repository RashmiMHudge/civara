import express from "express";
import {
  createShift,
  getAllShifts,
  getGuardShifts,
  updateShiftStatus,
  deleteShift
} from "../controllers/shift.controller.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create shift (admin)
router.post("/", protect, allowRoles("admin"), createShift);
// Get all shifts (admin)
router.get("/", protect, allowRoles("admin"), getAllShifts);
// Get shifts for a guard (security)
router.get("/guard/:guardId", protect, allowRoles("security", "admin"), getGuardShifts);

// Update shift status (admin)
router.patch("/:id/status", protect, allowRoles("admin"), updateShiftStatus);

// Delete shift (admin)
router.delete("/:id", protect, allowRoles("admin"), deleteShift);

export default router;
