import express from "express";
import {
    createVisitor,
    updateVisitorStatus,
    getMyVisitors,
    getAllVisitors
} from "../controllers/visitor.controller.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
    "/",
    protect,
    allowRoles("resident"),
    createVisitor
);
    

// Resident can cancel their own invite (set status to DENIED)
router.patch(
    "/:id/cancel",
    protect,
    allowRoles("resident"),
    async (req, res) => {
        const Visitor = (await import("../models/Visitor.js")).default;
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ message: "Visitor not found" });
        if (visitor.resident.id.toString() !== req.user.id) return res.status(403).json({ message: "Not your invite" });
        if (["CHECKED_IN","CHECKED_OUT","EXPIRED","DENIED"].includes(visitor.status)) {
            return res.status(400).json({ message: "Cannot cancel this invite" });
        }
        visitor.status = "DENIED";
        await visitor.save();
        res.json({ message: "Invite cancelled", visitor });
    }
);

router.patch(
    "/:id/status",
    protect,
    allowRoles("security", "admin"),
    updateVisitorStatus
);

router.get(
    "/my-visitors",
    protect,
    allowRoles("resident"),
    getMyVisitors
);
router.get(
    "/",
    protect,
    allowRoles("security", "admin"),
    getAllVisitors
);


export default router;
