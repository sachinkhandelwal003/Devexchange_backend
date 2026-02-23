import User  from "../models/user.js";
import Transaction from "../models/transaction.js";
 import AccountStatement from "../models/accountStatement.js"
  import AccountStatementCategory from "../models/accountStatementCategories.js"

import bcrypt from "bcryptjs"
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs"
import Bet from "../models/bet.js";
import Privilige from "../models/Priviliges.js";
import mongoose from "mongoose";


export const getOrCreateCategory = async (categoryName) => {
  const category = await AccountStatementCategory.findOneAndUpdate(
    { name: categoryName },
    { $setOnInsert: { name: categoryName } },
    { upsert: true, new: true }
  );

  return category._id;
};

export const getAdminAndUserCurrentBalance = async (req, res) => {
  try {
    const tokenUser = req.user; // from verifyToken middleware
    const { user_id } = req.query;

    if (!tokenUser || !tokenUser.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 🔥 Get logged-in user's balance (Admin OR Agent)
    const sender = await User
      .findById(tokenUser.id)
      .select("current_balance client_name account_type");

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Logged user not found"
      });
    }

    // 🔥 Get selected user's balance
    const selectedUser = await User
      .findById(user_id)
      .select("current_balance client_name");

    if (!selectedUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    return res.json({
      status: "success",
      data: {
        admin_current_balance: sender.current_balance, // dynamic (admin or agent)
        admin_name: sender.client_name,
        admin_role: sender.account_type,
        user_current_balance: selectedUser.current_balance
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getExposureLimit = async (req, res) => {
    try {
        let { user_id } = req.query;
        let userExists = await User.findOne({ _id: user_id }).select("exposure_limit");

        return res.json({
            status: "success",
            data: {
                exposure_limit: userExists.exposure_limit
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}


export const getCreditLimit = async (req, res) => {
    try {
        let { user_id } = req.query;
        let userExists = await User.findOne({ _id: user_id }).select("last_credit");

        return res.json({
            status: "success",
            data: {
                credit_limit: userExists.last_credit
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

export const getUserStatuses = async (req, res) => {
    try {
        let { user_id } = req.query;
        let userExists = await User.findOne({ _id: user_id }).select("can_bet is_active");
        return res.json({
            status: "success",
            data: {
                can_bet: userExists.can_bet,
                is_active: userExists.is_active
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}


export const makeDepositTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount_to_send, remark, transaction_password, user_id } = req.body;
    const senderId = req.user.id;

    if (!amount_to_send || amount_to_send <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // 🔹 Sender (Admin OR Agent)
    const sender = await User.findById(senderId).session(session);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // 🔐 Verify transaction password
    const isMatch = bcrypt.compareSync(
      transaction_password,
      sender.transaction_password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Transaction password incorrect" });
    }

    // 🔹 Receiver (Agent OR User)
    const receiver = await User.findById(user_id).session(session);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // 🔹 Balance check
    if (sender.current_balance < amount_to_send) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const senderPrevious = sender.current_balance;
    const receiverPrevious = receiver.current_balance;

    // 🔥 Update balances
    sender.current_balance -= amount_to_send;
    receiver.current_balance += amount_to_send;

    await sender.save({ session });
    await receiver.save({ session });

    // 🔥 Transaction Entry
    const transaction = await Transaction.create(
      [{
        transaction_type: "deposit",
        sender_id: sender._id,
        receiver_id: receiver._id,
        sender_type: sender.account_type,     // admin / agent
        receiver_type: receiver.account_type, // agent / user
        amount: amount_to_send,
        remark,
        admins_previous_amount: senderPrevious,
        admins_final_amount: sender.current_balance,
        users_previous_amount: receiverPrevious,
        users_final_amount: receiver.current_balance
      }],
      { session }
    );

    // 🔥 Account Statement (only for USER level)
    if (receiver.account_type === "user") {
      const categoryId = await getOrCreateCategory("deposit_withdraw_reports");

      await AccountStatement.create({
        customer_id: receiver._id,
        credit: amount_to_send,
        debit: 0,
        remark: `Deposit from ${sender.account_type}`,
        type: categoryId
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Deposit successful",
      data: transaction[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const makeWithdrawTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount_to_send, remark, transaction_password, user_id } = req.body;
    const receiverId = req.user.id; // Who is receiving money

    if (!amount_to_send || amount_to_send <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const receiver = await User.findById(receiverId).session(session);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const isMatch = bcrypt.compareSync(
      transaction_password,
      receiver.transaction_password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Transaction password incorrect" });
    }

    const sender = await User.findById(user_id).session(session);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (sender.current_balance < amount_to_send) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const senderPrevious = sender.current_balance;
    const receiverPrevious = receiver.current_balance;

    sender.current_balance -= amount_to_send;
    receiver.current_balance += amount_to_send;

    await sender.save({ session });
    await receiver.save({ session });

    const transaction = await Transaction.create(
      [{
        transaction_type: "withdraw",
        sender_id: sender._id,
        receiver_id: receiver._id,
        sender_type: sender.account_type,
        receiver_type: receiver.account_type,
        amount: amount_to_send,
        remark,
        admins_previous_amount: receiverPrevious,
        admins_final_amount: receiver.current_balance,
        users_previous_amount: senderPrevious,
        users_final_amount: sender.current_balance
      }],
      { session }
    );

    // 🔥 Account Statement for USER
    if (sender.account_type === "user") {
      const categoryId = await getOrCreateCategory("deposit_withdraw_reports");

      await AccountStatement.create({
        customer_id: sender._id,
        credit: 0,
        debit: amount_to_send,
        remark: `Withdraw to ${receiver.account_type}`,
        type: categoryId
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Withdraw successful",
      data: transaction[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const setExposureLimit = async (req, res) => {
    try {
        let { old_exposure_limit, new_exposure_limit, transaction_password, user_id } = req.body;

        // check admins transaction password
        let admins_transaction_password = await User.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await User.findOne({ _id: user_id }).select("exposure_limit");
        if (!userExists) {
            return res.json({ message: "No user exists" })
        }

        let admin = await User.findOne({ account_type: "admin" });

        // frontend will do the calculation from their side and we just needs to update the db

        let updated_user = await User.findOneAndUpdate({ _id: user_id }, { exposure_limit: Number(new_exposure_limit) }, { new: true });

        // make entry in transaction table 
        let transaction = await Transaction.create({
            transaction_type: "set_user_exposure_limit",
            sender_id: admin._id,
            receiver_id: updated_user._id,
            sender_type: "admin",
            receiver_type: "user",
            old_exposure_limit: old_exposure_limit, new_exposure_limit: new_exposure_limit
        });

        return res.json({
            status: "success",
            message: "Exposure Limit changed successfully",
            data: {
                transaction: transaction, user: updated_user, admin: admin
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

export const updateCreditReference = async (req, res) => {
    try {
        let { old_credit, new_credit, transaction_password, user_id } = req.body;

        // check admins transaction password
        let admins_transaction_password = await User.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await User.findOne({ _id: user_id }).select("exposure_limit");
        if (!userExists) {
            return res.json({ message: "No user exists" })
        }

        let admin = await User.findOne({ account_type: "admin" });

        // frontend will do the calculation from their side and we just needs to update the db

        let updated_user = await User.findOneAndUpdate({ _id: user_id }, { credit_ref: Number(new_credit) }, { new: true });

        // make entry in transaction table 
        let transaction = await Transaction.create({
            transaction_type: "set_credit_reference_to_user",
            sender_id: admin._id,
            receiver_id: updated_user._id,
            sender_type: "admin",
            receiver_type: "user",
            old_credit: old_credit, new_credit: new_credit
        });

        return res.json({
            status: "success",
            message: "Credit Limit changed successfully",
            data: {
                transaction: transaction, user: updated_user
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}


export const changePassword = async (req, res) => {
    try {
        let { new_password, transaction_password, user_id } = req.body;

        let admins_transaction_password = await User.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await User.findOne({ _id: user_id });
        if (!userExists) {
            return res.status(400).json({ message: "No user exists" })
        }


        let admin = await User.findOne({ account_type: "admin" });

        const salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(new_password, salt);
        let User = await User.findOneAndUpdate({ _id: user_id }, { password: hashedPassword }, { new: true });


        return res.json({
            status: "success",
            message: "User updated successfully",
            data: {
                user: User
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}



export const DownloadAccountListPdf = async (req, res) => {
    try {
        const allUsers = await User
            .find({ account_type: "user" })
            .sort({ createdAt: -1 });

        const doc = new PDFDocument({ margin: 30, size: "A4" });

        const fileName = `account-list-${Date.now()}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}`
        );

        doc.pipe(res);

        doc.fontSize(18).text("Account List", { align: "center" });
        doc.moveDown();

        doc.fontSize(10).text(
            "Username | Credit | Exposure | Default % | Account Type"
        );
        doc.moveDown(0.5);

        if (!allUsers.length) {
            doc.text("No users found");
        } else {
            allUsers.forEach((u) => {
                doc.text(
                    `${u.client_name} | ${u.credit_ref} | ${u.exposure_limit} | ${u.default_percentage || 0}% | ${u.account_type}`
                );
            });
        }

        doc.end();
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "PDF generation failed",
                error: error.message,
            });
        }
    }
};


export const DownloadUsersWinLossPdf = async (req, res) => {
    try {
        let from = req.query.from || "";
        let to = req.query.to || "";
        let search = req.query.search || "";

        let userQuery = { account_type: "user" };

        if (search) {
            userQuery.client_name = new RegExp(`^${search}`, "i");
        }

        const allUsers = await User.find(userQuery);

        let overall_casino_amount = 0;
        let overall_sport_amount = 0;
        let overall_third_party_amount = 0;
        let overall_profit_loss = 0;

        let usersData = [];

        for (let u of allUsers) {

            let betQuery = {
                user_id: u._id,
                bet_status: "settled"
            };

            if (from && to) {
                let fromDate = new Date(from);
                let toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);

                betQuery.createdAt = {
                    $gte: fromDate,
                    $lte: toDate
                };
            }

            const bets = await Bet.find(betQuery);

            let casino_amount = 0;
            let sport_amount = 0;
            let third_party_amount = 0;

            bets.forEach((bet) => {
                if (bet.bet_sub_type === "casino") {
                    casino_amount += Number(bet.profit_loss);
                } else if (bet.bet_sub_type === "sport") {
                    sport_amount += Number(bet.profit_loss);
                } else if (bet.bet_sub_type === "third_party") {
                    third_party_amount += Number(bet.profit_loss);
                }
            });

            let users_profit_loss =
                casino_amount + sport_amount + third_party_amount;

            overall_casino_amount += casino_amount;
            overall_sport_amount += sport_amount;
            overall_third_party_amount += third_party_amount;
            overall_profit_loss += users_profit_loss;

            usersData.push({
                client_name: u.client_name,
                casino_amount,
                sport_amount,
                third_party_amount,
                users_profit_loss
            });
        }

        // -------- PDF START --------

        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const fileName = `users-win-loss-${Date.now()}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}`
        );

        doc.pipe(res);

        doc.fontSize(18).text("Users Profit & Loss Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(10).text(
            "Client Name | Casino P/L | Sport P/L | Third Party P/L | Total P/L"
        );
        doc.moveDown(0.5);

        if (!usersData.length) {
            doc.text("No data found");
        } else {
            usersData.forEach((u) => {
                doc.text(
                    `${u.client_name} | ${u.casino_amount} | ${u.sport_amount} | ${u.third_party_amount} | ${u.users_profit_loss}`
                );
            });
        }

        doc.moveDown();
        doc.moveDown();

        doc.fontSize(12).text("Overall Totals", { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(10).text(
            `Casino: ${overall_casino_amount}`
        );
        doc.text(
            `Sport: ${overall_sport_amount}`
        );
        doc.text(
            `Third Party: ${overall_third_party_amount}`
        );
        doc.text(
            `Final Profit/Loss: ${overall_profit_loss}`
        );

        doc.end();

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "PDF generation failed",
                error: error.message,
            });
        }
    }
};


export const DownloadUsersWinLossExcel = async (req, res) => {
    try {
        let from = req.query.from || "";
        let to = req.query.to || "";
        let search = req.query.search || "";

        let userQuery = { account_type: "user" };

        if (search) {
            userQuery.client_name = new RegExp(`^${search}`, "i");
        }

        const allUsers = await User.find(userQuery);

        let overall_casino_amount = 0;
        let overall_sport_amount = 0;
        let overall_third_party_amount = 0;
        let overall_profit_loss = 0;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users Win Loss");

        // Header Row
        worksheet.columns = [
            { header: "Client Name", key: "client_name", width: 20 },
            { header: "Casino P/L", key: "casino_amount", width: 15 },
            { header: "Sport P/L", key: "sport_amount", width: 15 },
            { header: "Third Party P/L", key: "third_party_amount", width: 18 },
            { header: "Total P/L", key: "users_profit_loss", width: 15 },
        ];

        for (let u of allUsers) {

            let betQuery = {
                user_id: u._id,
                bet_status: "settled"
            };

            if (from && to) {
                let fromDate = new Date(from);
                let toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);

                betQuery.createdAt = {
                    $gte: fromDate,
                    $lte: toDate
                };
            }

            const bets = await Bet.find(betQuery);

            let casino_amount = 0;
            let sport_amount = 0;
            let third_party_amount = 0;

            bets.forEach((bet) => {
                if (bet.bet_sub_type === "casino") {
                    casino_amount += Number(bet.profit_loss);
                } else if (bet.bet_sub_type === "sport") {
                    sport_amount += Number(bet.profit_loss);
                } else if (bet.bet_sub_type === "third_party") {
                    third_party_amount += Number(bet.profit_loss);
                }
            });

            let users_profit_loss =
                casino_amount + sport_amount + third_party_amount;

            overall_casino_amount += casino_amount;
            overall_sport_amount += sport_amount;
            overall_third_party_amount += third_party_amount;
            overall_profit_loss += users_profit_loss;

            worksheet.addRow({
                client_name: u.client_name,
                casino_amount,
                sport_amount,
                third_party_amount,
                users_profit_loss
            });
        }

        // Add Empty Row
        worksheet.addRow([]);

        // Add Overall Totals
        worksheet.addRow({
            client_name: "OVERALL TOTAL",
            casino_amount: overall_casino_amount,
            sport_amount: overall_sport_amount,
            third_party_amount: overall_third_party_amount,
            users_profit_loss: overall_profit_loss
        });

        const fileName = `users-win-loss-${Date.now()}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Excel generation failed",
                error: error.message,
            });
        }
    }
};


export const DownloadAccountListExcel = async (req, res) => {
    try {
        const allUsers = await User
            .find({ account_type: "user" })
            .sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Account List");

        // Columns (same as PDF)
        worksheet.columns = [
            { header: "Username", key: "client_name", width: 25 },
            { header: "Credit", key: "credit_ref", width: 15 },
            { header: "Exposure", key: "exposure_limit", width: 15 },
            { header: "Default %", key: "default_percentage", width: 15 },
            { header: "Account Type", key: "account_type", width: 15 },
        ];

        // Rows
        allUsers.forEach((u) => {
            worksheet.addRow({
                client_name: u.client_name,
                credit_ref: u.credit_ref,
                exposure_limit: u.exposure_limit,
                default_percentage: u.default_percentage || 0,
                account_type: u.account_type,
            });
        });

        // Header styling (optional but nice)
        worksheet.getRow(1).font = { bold: true };

        const fileName = `account-list-${Date.now()}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Excel generation failed",
                error: error.message,
            });
        }
    }
};

export const adminAccountStatement = async (req, res) => {
  try {
    const tokenUser = req.user;
    const userId = new mongoose.Types.ObjectId(tokenUser.id);

    let {
      account_type,
      from,
      to,
      client_id,
      page = 1,
      limit = 25
    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    let query = {
      $or: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    };

    // ✅ Client Filter
    if (client_id) {
      const clientObjectId = new mongoose.Types.ObjectId(client_id);
      query.$and = [
        {
          $or: [
            { sender_id: clientObjectId },
            { receiver_id: clientObjectId }
          ]
        }
      ];
    }

    // ✅ Transaction Type
    if (account_type) {
      query.transaction_type = account_type;
    }

    // ✅ DATE RANGE FILTER (IMPORTANT FIX)
    if (from || to) {
      query.createdAt = {};

      if (from) {
        query.createdAt.$gte = new Date(from + "T00:00:00.000Z");
      }

      if (to) {
        query.createdAt.$lte = new Date(to + "T23:59:59.999Z");
      }
    }

    const statements = await Transaction.find(query)
      .populate("sender_id", "client_name account_type")
      .populate("receiver_id", "client_name account_type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return res.json({
      success: true,
      page,
      total,
      totalPages: Math.ceil(total / limit),
      data: statements
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const changeUserStatus = async (req, res) => {
    try {
        let { is_active, can_bet, transaction_password, user_id } = req.body;

        let admins_transaction_password = await User.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await User.findOne({ _id: user_id });
        if (!userExists) {
            return res.status(400).json({ message: "No user exists" })
        }
        //is_active , can_bet
        let updateUser = await User.findOneAndUpdate({ _id: user_id }, {
            is_active: is_active, can_bet: can_bet
        }, { new: true });

        return res.json({
            status: "success",
            message: "User updated successfully",
            data: {
                user: updateUser
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}


export const getAllBets = async (req, res) => {
  try {
    const tokenUser = req.user;

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    let page = req.query.page ? Number(req.query.page) : 1;
    let limit = req.query.limit ? Number(req.query.limit) : 10;
    let skip = (page - 1) * limit;

    let filter = req.query.filter || "matched";
    let back_lay = req.query.back_lay || "all";
    let search = req.query.search || "";

    let query = {};

    // ===== ROLE BASED FILTER =====

    if (tokenUser.role === "user") {
      query.user_id = tokenUser.id;
    }

    if (tokenUser.role === "agent") {
      // Get all users created by this agent
      const users = await User.find({
        created_by_id: tokenUser.id
      }).select("_id");

      const userIds = users.map(u => u._id);

      query.user_id = { $in: userIds };
    }

    // Admin sees all → no filter

    // ===== STATUS FILTER =====

    if (filter) {
      query.bet_status = filter;
    }

    if (back_lay !== "all") {
      query.bet_type = back_lay;
    }

    if (search) {
      query.$or = [
        { user_name: { $regex: search, $options: "i" } },
        { event_name: { $regex: search, $options: "i" } }
      ];
    }

    const bets = await Bet.find(query)
      .populate({
        path: "user_id",
        select: "client_name full_name account_type"
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalBets = await Bet.countDocuments(query);

    let total_stake_amount = 0;
    let total_liability_amount = 0;

    bets.forEach((bet) => {
      total_stake_amount += Number(bet.stake);
      total_liability_amount += Number(bet.liability);
    });

    return res.status(200).json({
      success: true,
      page,
      limit,
      total: totalBets,
      totalPages: Math.ceil(totalBets / limit),
      count: bets.length,
      data: bets,
      totals: {
        total_stake_amount,
        total_liability_amount
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getSingleBet = async (req, res) => {
  try {
    const { id } = req.params;
    const tokenUser = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Bet ID is required"
      });
    }

    const bet = await Bet.findById(id)
      .populate("user_id", "client_name full_name account_type");

    if (!bet) {
      return res.status(404).json({
        success: false,
        message: "Bet not found"
      });
    }

    // ===== ROLE CHECK =====

    if (tokenUser.role === "user" &&
        bet.user_id._id.toString() !== tokenUser.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    if (tokenUser.role === "agent") {
      const user = await User.findOne({
        _id: bet.user_id._id,
        created_by_id: tokenUser.id
      });

      if (!user) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    // Admin allowed

    return res.status(200).json({
      success: true,
      data: bet
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getProfitLossOfUsers = async (req, res) => {
    try {
        let page = req.query.page ? Number(req.query.page) : 1;
        let limit = req.query.limit ? Number(req.query.limit) : 10;
        let skip = (page - 1) * limit;

        let query = {
            bet_status: "settled"
        }
        let status = req.query.status || "all"; // profit , loss

        if (status != "all") {
            if (status == "loss") {
                query.profit_loss = { $lte: 0 }
            } else if (status == "profit") {
                query.profit_loss = { $gt: 0 }
            }
        }

        let search = req.query.search || "";
        if (search != "") {
            query.$or = [
                { user_name: { $regex: search, $options: "i" } },
                { event_name: { $regex: search, $options: "i" } }
            ]
        }

        let bets = await Bet.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

        const totalBets = await Bet.countDocuments(query);


        return res.status(200).json({
            success: true,
            page,
            limit,
            total: totalBets,
            totalPages: Math.ceil(totalBets / limit),
            count: bets.length,
            data: bets,
            message: "All Bets fetched successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



export const getUsersWinOrLoss = async (req, res) => {
  try {
    const { from, to, search } = req.query;
    const tokenUser = req.user;

    let matchStage = {
      bet_status: "settled"
    };

    // ✅ Date filter
    if (from || to) {
      matchStage.settled_at = {};
      if (from)
        matchStage.settled_at.$gte = new Date(from + "T00:00:00.000Z");
      if (to)
        matchStage.settled_at.$lte = new Date(to + "T23:59:59.999Z");
    }

    // ======================================
    // 🔥 AGENT RESTRICTION (BASED ON TOKEN ROLE)
    // ======================================

    if (tokenUser.role === "agent") {
      const agentUsers = await User.find({
        created_by_id: new mongoose.Types.ObjectId(tokenUser.id),
        account_type: "user"
      }).select("_id");

      const userIds = agentUsers.map(u => u._id);

      // If no customers → return empty result
      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            all_users: [],
            overall_casino_amount: 0,
            overall_sport_amount: 0,
            overall_third_party_amount: 0,
            overall_profit_loss: 0
          }
        });
      }

      matchStage.user_id = { $in: userIds };
    }

    // Admin → no restriction

    // ======================================
    // AGGREGATION
    // ======================================

    const aggregation = await Bet.aggregate([
      { $match: matchStage },

      {
        $group: {
          _id: "$user_id",
          casino_amount: {
            $sum: {
              $cond: [{ $eq: ["$bet_sub_type", "casino"] }, "$profit_loss", 0]
            }
          },
          sport_amount: {
            $sum: {
              $cond: [{ $eq: ["$bet_sub_type", "sport"] }, "$profit_loss", 0]
            }
          },
          third_party_amount: {
            $sum: {
              $cond: [{ $eq: ["$bet_sub_type", "third_party"] }, "$profit_loss", 0]
            }
          },
          users_profit_loss: { $sum: "$profit_loss" }
        }
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },

      { $unwind: "$user" }
    ]);

    // ======================================
    // SEARCH FILTER
    // ======================================

    let filteredData = aggregation;

    if (search) {
      filteredData = aggregation.filter(item =>
        item.user.client_name
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    // ======================================
    // TOTALS
    // ======================================

    let overall_casino_amount = 0;
    let overall_sport_amount = 0;
    let overall_third_party_amount = 0;
    let overall_profit_loss = 0;

    filteredData.forEach(item => {
      overall_casino_amount += item.casino_amount;
      overall_sport_amount += item.sport_amount;
      overall_third_party_amount += item.third_party_amount;
      overall_profit_loss += item.users_profit_loss;
    });

    return res.status(200).json({
      success: true,
      data: {
        all_users: filteredData,
        overall_casino_amount,
        overall_sport_amount,
        overall_third_party_amount,
        overall_profit_loss
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getGeneralReport = async (req, res) => {
    try {
        let page = req.query.page ? Number(req.query.page) : 1;
        let limit = req.query.limit ? Number(req.query.limit) : 10;
        let skip = (page - 1) * limit;
        let search = req.query.search || "";

        let query = {};

        if (search != "") {
            query.$or = [
                { user_name: { $regex: search, $options: "i" } },
                { event_name: { $regex: search, $options: "i" } }
            ]
        }

        let bets = await Bet.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

        const totalBets = await Bet.countDocuments(query);

        let total_soda_amount = 0;
        let total_amount = 0;
        bets.map((bet) => {
            total_soda_amount += Number(bet.stake)
            total_amount += Number(bet.liability)
        })

        return res.status(200).json({
            success: true,
            page,
            limit,
            total: totalBets,
            totalPages: Math.ceil(totalBets / limit),
            count: bets.length,
            data: bets,
            total_soda_amount,
            total_amount,
            message: "All Bets fetched successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const GetMatchAnalysis = async (req, res) => {
    try {

        let query = {
            result: "pending"
        }

        let bets = await Bet.find(query);

        let match_map = new Map() // here we will 
        bets.map((bet) => {
            if (!match_map.has(bet.event_name)) {
                match_map.set(bet.event_name, [])
            }

            match_map.get(bet.event_name).push(bet);
        })

        let grouped_data = Object.fromEntries(match_map);

        return res.status(200).json({
            success: true,
            data: grouped_data,
            message: "Data fetched successfully ",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const makePriviliges = async (req, res) => {
    try {

        let privilge = await Privilige.create({ ...req.body })

        return res.status(200).json({
            success: true,
            data: privilge,
            message: "Privilige created successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getAllPriviliges = async (req, res) => {
    try {

        let privilges = await Privilige.find({})

        return res.status(200).json({
            success: true,
            data: privilges,
            message: "Privilige fetched successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};





















































