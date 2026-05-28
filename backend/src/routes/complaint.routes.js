
import express from "express";
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  assignComplaint,
  resolveComplaint,
  submitFeedback,
  updateAutomationResult,
  updateAutomationFromWebhook,
  captureWhatsappReplyFromWebhook,
  changeComplaintStatus,
  rescheduleComplaintVisit,
  getComplaintTrend,
  getComplaintCategoryBreakdown,
  getComplaintSLAStats
} from "../controllers/complaint.controller.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";
const router = express.Router();

// Analytics endpoints (admin only)
router.get(
  "/trend",
  protect,
  allowRoles("admin"),
  getComplaintTrend
);
router.get(
  "/category-breakdown",
  protect,
  allowRoles("admin"),
  getComplaintCategoryBreakdown
);
router.get(
  "/sla-stats",
  protect,
  allowRoles("admin"),
  getComplaintSLAStats
);

/* ===============================
   RESIDENT ROUTES
================================ */
router.post(
  "/",
  protect,
  allowRoles("resident"),
  upload.array("attachments", 5), // max 5 files
  createComplaint
);

router.post(
  "/:id/feedback",
  protect,
  allowRoles("resident"),
  submitFeedback
);

router.patch(
  "/:id/reschedule",
  protect,
  allowRoles("resident", "admin"),
  rescheduleComplaintVisit
);

router.get(
  "/my",
  protect,
  allowRoles("resident"),
  getMyComplaints
);

/* ===============================
   ADMIN ROUTES
================================ */
router.get(
  "/",
  protect,
  allowRoles("admin"),
  getAllComplaints
);

router.get(
  "/:id",
  protect,
  allowRoles("admin", "resident"),
  getComplaintById
);

router.patch(
  "/:id/assign",
  protect,
  allowRoles("admin"),
  assignComplaint
);

router.patch(
  "/:id/resolve",
  protect,
  allowRoles("admin"),
  resolveComplaint
);

router.patch(
  "/:id/status",
  protect,
  allowRoles("admin"),
  changeComplaintStatus
);

router.patch(
  "/:id/automation",
  protect,
  allowRoles("admin"),
  updateAutomationResult
);

router.patch(
  "/automation/webhook/:id",
  updateAutomationFromWebhook
);

router.post(
  "/automation/whatsapp-reply",
  captureWhatsappReplyFromWebhook
);

export default router;
