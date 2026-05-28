import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { getSecurityProfile, uploadSecurityAvatar, updateSecurityPassword } from "../controllers/security.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get(
  "/profile",
  protect,
  allowRoles("security"),
  getSecurityProfile
);

// UPLOAD OR UPDATE SECURITY AVATAR
router.post(
  "/profile/avatar",
  protect,
  allowRoles("security"),
  upload.single("avatar"),
  uploadSecurityAvatar
);

// UPDATE SECURITY PASSWORD
router.put(
  "/profile/password",
  protect,
  allowRoles("security"),
  updateSecurityPassword
);

export default router;