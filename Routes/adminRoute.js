import express from "express";
import { verifyToken } from "../utils/VerifyToken.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";
import { getAdminAndUserCurrentBalance } from "../Controllers/adminControllers.js";
import { getExposureLimit } from "../Controllers/adminControllers.js"
import { getCreditLimit } from "../Controllers/adminControllers.js"
import { getUserStatuses } from "../Controllers/adminControllers.js"
import { makeDepositTransaction } from "../Controllers/adminControllers.js"
import { makeWithdrawTransaction } from "../Controllers/adminControllers.js"
import { setExposureLimit } from "../Controllers/adminControllers.js"
import { updateCreditReference } from "../Controllers/adminControllers.js"
import { changePassword } from "../Controllers/adminControllers.js"

const router = express.Router();

router.get("/get-admin-user-balance", verifyToken, verifyAdmin, getAdminAndUserCurrentBalance)
router.get("/get-user-exposure-limit", verifyToken, verifyAdmin, getExposureLimit)
router.get("/get-user-credit-limit", verifyToken, verifyAdmin, getCreditLimit)
router.get("/get-user-statuses", verifyToken, verifyAdmin, getUserStatuses)
router.post("/make-deposit-transaction", verifyToken, verifyAdmin, makeDepositTransaction)
router.post("/make-withdraw-transaction", verifyToken, verifyAdmin, makeWithdrawTransaction)
router.post("/set-exposure-limit", verifyToken, verifyAdmin, setExposureLimit)
router.post("/update-credit-reference", verifyToken, verifyAdmin, updateCreditReference)
router.post("/change-users-password", verifyToken, verifyAdmin, changePassword)

export default router;