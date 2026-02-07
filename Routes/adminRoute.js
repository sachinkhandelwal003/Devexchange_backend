import express from "express";
import { verifyToken } from "../utils/VerifyToken.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";
import { getAdminAndUserCurrentBalance } from "../Controllers/adminControllers.js";

const router = express.Router();

// --- AUTHENTICATION ROUTES ---

// User Login -> http://localhost:3000/api/users/login
router.get("/get-admin-user-balance",getAdminAndUserCurrentBalance)

export default router;