import express from "express";
import { verifyToken } from "../utils/VerifyToken.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";
import { getAdminAndUserCurrentBalance } from "../Controllers/adminControllers.js";
import {getExposureLimit} from "../Controllers/adminControllers.js"
const router = express.Router();

router.get("/get-admin-user-balance",verifyToken,verifyAdmin,getAdminAndUserCurrentBalance)
router.get("/get-user-exposure-limit",verifyToken,verifyAdmin,getExposureLimit)

export default router;