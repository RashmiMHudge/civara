import express from "express";
import { login } from "../controllers/auth.controller.js";

const router = express.Router();


// General login
router.post("/login", login);

// Security guard login (by guardId)
import { securityLogin } from "../controllers/auth.controller.js";
router.post("/security-login", securityLogin);

export default router;
