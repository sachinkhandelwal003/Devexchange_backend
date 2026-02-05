// import User from "../models/user.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // --- 1. REGISTER USER (Create) ---
// export const createUser = async (req, res) => {
//   try {
//     const {
//       username,
//       email,
//       password,
//       creditRef,
//       userStatus,
//       balanceStatus,
//       exposureLimit,
//       defaultPercent,
//       accountType,
//     } = req.body;

//     // Validation
//     if (!username || !email || !password) {
//       return res.status(400).json({ success: false, message: "Username, Email & Password required" });
//     }

//     // Check Duplicate
//     const existingUser = await User.findOne({ $or: [{ email }, { username }] });
//     if (existingUser) {
//       return res.status(409).json({ success: false, message: "User already exists" });
//     }

//     // Hash Password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create
//     const user = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//       creditRef,
//       userStatus,
//       balanceStatus,
//       exposureLimit,
//       defaultPercent,
//       accountType: accountType || "user",
//     });

//     res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       data: { id: user._id, username: user.username, email: user.email, role: user.accountType }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server Error", error: error.message });
//   }
// };

// // --- 2. USER LOGIN ---
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     // Role Check
//     if (user.accountType === 'admin') {
//        return res.status(403).json({ success: false, message: "Admins please use Admin Login" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

//     const token = jwt.sign({ id: user._id, role: user.accountType }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });

//     res.status(200).json({ success: true, message: "Login successful", token, data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// // --- 3. ADMIN LOGIN ---
// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: "Admin not found" });

//     // Strict Role Check
//     if (user.accountType !== 'admin') {
//       return res.status(403).json({ success: false, message: "Access Denied. Not an Admin." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Admin credentials" });

//     const token = jwt.sign({ id: user._id, role: "admin" }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });

//     res.status(200).json({ success: true, message: "Admin Login Successful", token, data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// // --- CRUD Operations ---
// export const getAllUsers = async (req, res) => {
//   try {
//     // ❌ Purana: const users = await User.find().sort({ createdAt: -1 });

//     // ✅ Naya Change:
//     // { accountType: { $ne: "admin" } } ka matlab hai:
//     // "Wo users laao jinka accountType 'admin' KE BARABAR NAHI hai"
//     const users = await User.find({ accountType: { $ne: "admin" } }).sort({ createdAt: -1 });

//     res.json({ success: true, count: users.length, data: users });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// export const getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });
//     res.json({ success: true, data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Invalid ID" });
//   }
// };

// export const updateUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });
//     res.json({ success: true, message: "User updated", data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Update failed" });
//   }
// };

// export const deleteUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });
//     res.json({ success: true, message: "User deleted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Delete failed" });
//   }
// };

import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- 1. REGISTER USER (Create) ---
export const createUser = async (req, res) => {
  try {
    const { client_name, password } = req.body;

    const userNameExists = await User.findOne({ client_name });
    if (userNameExists) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const hashedTransactionPassword = await bcrypt.hash(
      req.body.transaction_password,
      salt,
    );

    // Create
    const user = await User.create({
      ...req.body,
      password: hashedPassword,
      transaction_password: hashedTransactionPassword,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// --- 2. USER LOGIN ---
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Role Check
    if (user.accountType === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admins please use Admin Login" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.accountType },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );

    res
      .status(200)
      .json({ success: true, message: "Login successful", token, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- 3. ADMIN LOGIN ---
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    // Strict Role Check
    if (user.accountType !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied. Not an Admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid Admin credentials" });

    const token = jwt.sign(
      { id: user._id, role: "admin" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );

    res.status(200).json({
      success: true,
      message: "Admin Login Successful",
      token,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- CRUD Operations ---

// 👉 UPDATED: Admin ab list mein nahi dikhega
export const getAllUsers = async (req, res) => {
  try {
    // { accountType: { $ne: "admin" } } -> Iska matlab "Not Equal to Admin"
    const users = await User.find({ accountType: { $ne: "admin" } }).sort({
      createdAt: -1,
    });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Invalid ID" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
