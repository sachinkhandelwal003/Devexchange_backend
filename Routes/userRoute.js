import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,   // Imported
  loginAdmin,  // Imported
} from "../Controllers/userController.js";

const router = express.Router();

// --- AUTHENTICATION ROUTES ---

// User Login -> http://localhost:3000/api/users/login
router.post("/login", loginUser);

// Admin Login -> http://localhost:3000/api/users/admin-login
router.post("/admin-login", loginAdmin);


// --- CRUD ROUTES ---

// Create user (Register)
router.post("/create-user", createUser);

// Get all users
router.get("/", getAllUsers);

// Get single user
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

export default router;