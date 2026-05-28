import express from "express";
import {
  triggerEmergency,
  getMyEmergencies,
  resolveEmergency,
  getAllEmergencies
} from "../controllers/emergency.controller.js";

import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =====================================================
    (RESIDENT routes )
===================================================== */
router.post(
  "/",
  protect,
  allowRoles("resident"),
  triggerEmergency
);

router.get(
  "/my",
  protect,
  allowRoles("resident"),
  getMyEmergencies
);

/* =====================================================
    (ADMIN/SECURITY routes )
===================================================== */

router.get(
  "/",
  protect,
  allowRoles("admin", "security"),
  getMyEmergencies
);

router.get(
  "/all",
  protect,
  allowRoles("admin", "security"),
  getAllEmergencies
);

router.patch(
  "/:id/resolve",
  protect,
  allowRoles("admin", "security"),
  resolveEmergency
);

export default router;