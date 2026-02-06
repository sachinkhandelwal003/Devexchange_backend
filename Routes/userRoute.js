import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,   // Imported
  loginAdmin,  // Imported
  AdminChangePassword,
  getAllAccountStatements
} from "../Controllers/userController.js";
import { verifyToken } from "../utils/VerifyToken.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";
import  verifyUser  from "../utils/verifyUser.js";

const router = express.Router();

// --- AUTHENTICATION ROUTES ---

// User Login -> http://localhost:3000/api/users/login
router.post("/user-login", loginUser);
// router.post("/user-forgot-password", forgotPassword);

// Admin Login -> http://localhost:3000/api/users/admin-login
router.post("/admin-login", loginAdmin);


router.post("/admin-change-password",verifyToken,verifyAdmin, AdminChangePassword);


// Create user (Register)
router.post("/create-user",verifyToken,createUser);

// Get all users
router.get("/get-all-users", verifyToken,verifyAdmin,getAllUsers);

router.get("/get-all-account-statements", verifyToken,verifyUser,getAllAccountStatements);

// get all account statements
// router.get("/get-all-account-statements")


// Get single user
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

export default router;