import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/admin",
  protect,
  allowRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

router.get(
  "/security",
  protect,
  allowRoles("security"),
  (req, res) => {
    res.json({ message: "Security access granted" });
  }
);

router.get(
  "/resident",
  protect,
  allowRoles("resident"),
  (req, res) => {
    res.json({ message: "Resident access granted" });
  }
);

export default router;
