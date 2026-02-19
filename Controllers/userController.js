import User from "../models/user.js";
import mongoose from "mongoose";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AccountStatement from "../models/accountStatement.js";
import AccountStatementCategory from "../models/accountStatementCategories.js";
import Bet from "../models/bet.js";

// --- 1. REGISTER USER (Create) ---
export const createUser = async (req, res) => {
  try {
    const token_user = req.user;

    console.log("token userrrrrrrrrrrrrrr", token_user);
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
      is_demo:false
    });


    await AccountStatement.create({
      customer_id: user._id, credit: 0, debit: 0, pts: 0, type: ["6985c831789580a168ceb1d7", "6985c8d637e25286b31c7594", "6985c8d737e25286b31c7596", "6985cd4c42279fc87eca0e7a"], remark: "Opening Pts"
    })

    await AccountStatement.create({
      customer_id: user._id, credit: 1500, debit: 0, type: ["6985c831789580a168ceb1d7"], pts: 1500, remark: "User creation"
    })

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


export const changeStatus = async (req, res) => {
  try {
    const token_user = req.user;

    console.log("token userrrrrrrrrrrrrrr", token_user);
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


    await AccountStatement.create({
      customer_id: user._id, credit: 0, debit: 0, pts: 0, type: ["6985c831789580a168ceb1d7", "6985c8d637e25286b31c7594", "6985c8d737e25286b31c7596", "6985cd4c42279fc87eca0e7a"], remark: "Opening Pts"
    })

    await AccountStatement.create({
      customer_id: user._id, credit: 1500, debit: 0, type: ["6985c831789580a168ceb1d7"], pts: 1500, remark: "User creation"
    })

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

    const { client_name, password } = req.body;
    console.log("client_name and password", client_name, password);
    const user = await User.findOne({ client_name });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });



 if (user.account_type === "admin") {
      return res.status(403).json({
        success: false,
        message: "Invalid credentials",
      });
    }

     if (!user.can_bet) { // <-- assuming your schema has isActive: true/false
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.account_type },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "100d" },
    );

    res
      .status(200)
      .json({ success: true, message: "Login successful", token, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const demoLogin = async (req, res) => {
  try {
const user = await User.findOne({ is_demo: { $in: [true, "true"] } });
console.log("useruser",user)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Demo user not found",
      }); 
    }

    const token = jwt.sign(
      { id: user._id, role: user.account_type, demo: true },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" } // short expiry for demo
    );

    res.status(200).json({
      success: true,
      message: "Demo login successful",
      token,
      data: user,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// --- 3. ADMIN LOGIN   sfdgsdfg---
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("username and password", username, password);
    const user = await User.findOne({ client_name: username });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    // Strict Role Check
    if (user.account_type !== "admin") {
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
      { expiresIn: "100d" },
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

export const AdminChangePassword = async (req, res) => {
  try {
    const { password, old_password } = req.body;
    // console.log("username and password", username, password);
    const user = await User.findOne({ account_type: "admin" });

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid Old Password" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let data = await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    res.status(200).json({
      success: true,
      message: "Admin Password Changed Successfully",
      data: data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    let limit = Number(req.query.limit) || 10;
    let page = Number(req.query.page) || 1;
    let skip = (page - 1) * limit;

    let query = { account_type: { $ne: "admin" } };

    let search = req.query.search || "";

    if (search != "") {
      query.$or = [
        { client_name: { $regex: search, $options: "i" } },
        { full_name: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);

    // { accountType: { $ne: "admin" } } -> Iska matlab "Not Equal to Admin"
    const users = await User.find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      total: totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      count: users.length,
      data: users,
      message: "All users fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllAccountStatements = async (req, res) => {
  try {
    let page = req.query.page ? Number(req.query.page) : 1;
    let limit = req.query.limit ? Number(req.query.limit) : 10;
    let skip = (page - 1) * limit;
    let customer = req.user;

    let to = req.query.to;
    let from = req.query.from;

    let type = req.query.type || "";

    let search = req.query.search || "";

    let query = {
      customer_id: customer._id
    }

    if (type) {
      query.type = {
        $in: [
          type
        ]
      }
    }

    if (search != "") {
      query.remark = { $regex: search, $options: "i" }
    }


    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    let statements = await AccountStatement.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

    const totalStatements = await AccountStatement.countDocuments(query);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total: totalStatements,
      totalPages: Math.ceil(totalStatements / limit),
      count: statements.length,
      data: statements,
      message: "Account statements fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getProfile = async (req, res) => {
  try {

    let user = req.user;

    let data = await User.findOne({ _id: user.id })

    return res.status(200).json({
      success: true,
      data: data,
      message: "Account Details fetched successfully",
    });
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
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 1️⃣ Check if user has balance
    if (user.current_balance !== 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with remaining balance"
      });
    }

    // 2️⃣ Check if user has credit reference
    if (user.credit_ref > 0) {
      return res.status(400).json({
        success: false,
        message: "Clear credit reference before deleting user"
      });
    }

    // 3️⃣ Soft delete (recommended)
    user.is_active = false;
    user.can_bet = false;

    await user.save();

    return res.json({
      success: true,
      message: "User deactivated successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optional: prevent deactivating if balance or credit exists
    if (user.is_active && (user.current_balance !== 0 || user.credit_ref > 0)) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate user with balance or credit",
      });
    }

    // Toggle active status
    user.is_active = !user.is_active;

    // Also control betting ability based on active status
    user.can_bet = user.is_active;

    await user.save();

    return res.json({
      success: true,
      message: `User has been ${user.is_active ? "activated" : "deactivated"} successfully`,
      data: {
        is_active: user.is_active,
        can_bet: user.can_bet,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Operation failed",
      error: error.message,
    });
  }
};



export const MakeBet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user_id,
      event_id,
      market_id,
      selection_id,
      selection_name,
      bet_type,
      odds,
      stake
    } = req.body;

    // ===== BASIC VALIDATION =====
    if (!user_id || !bet_type || !odds || !stake) {
      throw new Error("Missing required fields");
    }

    if (stake <= 0 || odds <= 1) {
      throw new Error("Invalid stake or odds");
    }

    if (!["back", "lay"].includes(bet_type)) {
      throw new Error("Invalid bet type");
    }

    // ===== GET USER =====
    const user = await User.findById(user_id).session(session);

    if (!user) throw new Error("User not found");

    if (!user.is_active || !user.can_bet) {
      throw new Error("User not allowed to bet");
    }

    // ===== PROTECT NEGATIVE EXPOSURE =====
    if (user.used_exposure < 0) {
      user.used_exposure = 0;
    }

    // ===== CALCULATE LIABILITY =====
    let liability = 0;

    if (bet_type === "back") {
      liability = stake;
    } else {
      liability = (odds - 1) * stake;
    }

    // ===== CALCULATE NEW EXPOSURE =====
    const oldExposure = user.used_exposure;
    const newExposure = oldExposure + liability;

    if (newExposure > user.exposure_limit) {
      throw new Error("Exposure limit exceeded");
    }

    // ===== FREEZE EXPOSURE =====
    user.used_exposure = newExposure;
    user.available_balance = user.current_balance - newExposure;

    await user.save({ session });

    // ===== DEBUG (NOW CORRECT) =====
    console.log("===== PLACE BET DEBUG =====");
    console.log("User Balance:", user.current_balance);
    console.log("Used Exposure Before:", oldExposure);
    console.log("Liability:", liability);
    console.log("New Exposure:", newExposure);
    console.log("Exposure Limit:", user.exposure_limit);

    // ===== CREATE BET =====
    const bet = await Bet.create([{
      user_id,
      event_id,
      market_id,
      selection_id,
      selection_name,
      bet_type,
      odds,
      stake,
      liability,
      profit_loss: 0,
      result: "pending",
      bet_status: "matched",
      placed_at: new Date()
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Bet placed successfully",
      bet: bet[0],
      exposure: {
        used_exposure: user.used_exposure,
        available_balance: user.available_balance
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};




export const settleMarket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { event_id, winner_selection_id } = req.body;

    if (!event_id || !winner_selection_id) {
      throw new Error("Event ID and winner selection required");
    }

    // ===== GET ALL MATCHED BETS =====
    const bets = await Bet.find({
      event_id,
      bet_status: "matched"
    }).session(session);

    if (!bets.length) {
      throw new Error("No matched bets found");
    }

    for (let bet of bets) {

      let profit = 0;

      // ===============================
      // 1️⃣ CALCULATE PROFIT / LOSS
      // ===============================

      if (bet.bet_type === "back") {

        if (bet.selection_id === winner_selection_id) {
          profit = (bet.odds - 1) * bet.stake;
        } else {
          profit = -bet.stake;
        }

      } else { // LAY BET

        if (bet.selection_id === winner_selection_id) {
          profit = -bet.liability;
        } else {
          profit = bet.stake;
        }
      }

      // ===============================
      // 2️⃣ UPDATE BET RECORD
      // ===============================

      bet.profit_loss = profit;
      bet.bet_status = "settled";
      bet.settled_at = new Date();

      if (profit > 0) bet.result = "win";
      else if (profit < 0) bet.result = "loss";
      else bet.result = "void";

      await bet.save({ session });

      // ===============================
      // 3️⃣ UPDATE USER BALANCE
      // ===============================

      const user = await User.findById(bet.user_id).session(session);

      if (!user) continue;

      // Protect negative exposure
      if (user.used_exposure < 0) {
        user.used_exposure = 0;
      }

      const oldExposure = user.used_exposure;
      const oldBalance = user.current_balance;

      // 🔓 Release exposure
      user.used_exposure = Math.max(
        0,
        user.used_exposure - bet.liability
      );

      // 💰 Apply profit/loss to real wallet
      user.current_balance += profit;

      // 🧮 Recalculate available balance
      user.available_balance =
        user.current_balance - user.used_exposure;

      await user.save({ session });

      // ===============================
      // DEBUG LOG
      // ===============================

      console.log("===== SETTLEMENT DEBUG =====");
      console.log("Bet ID:", bet._id);
      console.log("Bet Type:", bet.bet_type);
      console.log("Stake:", bet.stake);
      console.log("Odds:", bet.odds);
      console.log("Liability:", bet.liability);
      console.log("Profit:", profit);
      console.log("Old Exposure:", oldExposure);
      console.log("New Exposure:", user.used_exposure);
      console.log("Old Balance:", oldBalance);
      console.log("New Balance:", user.current_balance);
      console.log("================================");
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Market settled successfully"
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



