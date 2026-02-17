import User from "../models/user.js";
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

// --- 3. ADMIN LOGIN ---
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


export const MakeBet = async (req, res) => {
  try {
    console.log("bodyyyyyyyyyyyyyyyyyyyy", req.body)
    let user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.is_active || !user.can_bet) {
      return res.status(403).json({
        success: false,
        message: "User is not allowed to bet"
      });
    }

    let liability = 0;

    if (req.body.bet_type == "back") {
      liability = req.body.stake;
    }

    if (req.body.bet_type == "lay") {
      liability = (req.body.odds - 1) * req.body.stake;
    }

    if (req.body.liability > user.exposure_limit) {
      return res.status(400).json({
        success: false,
        message: "Exposure limit exceeded"
      });
    }

    const bet = await Bet.create({ ...req.body, liability });

    res.json({ success: true, message: "Bet Created successfully", data: bet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error while making bet", error });
  }
};
