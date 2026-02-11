import user from "../models/user.js";
import Transaction from "../models/transaction.js";
import bcrypt from "bcryptjs"
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs"
import Bet from "../models/bet.js";

export const getAdminAndUserCurrentBalance = async (req, res) => {
    try {
        let { user_id } = req.query;
        let admin = await user.findOne({ account_type: "admin" }).select("current_balance");
        let userExists = await user.findOne({ _id: user_id }).select("current_balance");

        return res.json({
            status: "success",
            data: {
                admin_current_balance: admin.current_balance,
                user_current_balance: userExists.current_balance
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

export const getExposureLimit = async (req, res) => {
    try {
        let { user_id } = req.query;
        let userExists = await user.findOne({ _id: user_id }).select("exposure_limit");

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
        let userExists = await user.findOne({ _id: user_id }).select("last_credit");

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
        let userExists = await user.findOne({ _id: user_id }).select("can_bet is_active");
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
    try {
        let { admins_previous_amount, users_previous_amount, admins_final_amount, users_final_amount, amount_to_send, remark, transaction_password, user_id } = req.body;

        // check admins transaction password
        let admins_transaction_password = await user.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await user.findOne({ _id: user_id }).select("current_balance");
        if (!userExists) {
            return res.json({ message: "No user exists" })
        }


        // user's accpunt balance should increase 
        // superadmins account balance should decrease


        // let admin = await user.findone({ account_type: "admin" });

        // frontend will do the calculation from their side and we just needs to update the db

        let updated_user = await user.findOneAndUpdate({ _id: user_id }, { current_balance: Number(users_final_amount) }, { new: true });
        let updated_admin = await user.findOneAndUpdate({ account_type: "admin" }, { current_balance: Number(admins_final_amount) }, { new: true })


        // make entry in transaction table 
        let transaction = await Transaction.create({
            transaction_type: "deposit_to_user_from_admin",
            sender_id: updated_admin._id,
            receiver_id: updated_user._id,
            remark: remark,
            sender_type: "admin",
            receiver_type: "user",
            amount: Number(amount_to_send),
            admins_previous_amount: Number(admins_previous_amount),
            users_previous_amount: Number(users_previous_amount),
            admins_final_amount: Number(admins_final_amount),
            users_final_amount: Number(users_final_amount)
        });

        return res.json({
            status: "success",
            message: "Money deposit successfully",
            data: {
                transaction: transaction, user: updated_user, admin: updated_admin
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}


export const makeWithdrawTransaction = async (req, res) => {
    try {
        let { admins_previous_amount, users_previous_amount, admins_final_amount, users_final_amount, amount_to_send, remark, transaction_password, user_id } = req.body;

        // check admins transaction password
        let admins_transaction_password = await user.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await user.findOne({ _id: user_id }).select("current_balance");
        if (!userExists) {
            return res.json({ message: "No user exists" })
        }

        // let admin = await user.findone({ account_type: "admin" });

        // frontend will do the calculation from their side and we just needs to update the db

        let updated_user = await user.findOneAndUpdate({ _id: user_id }, { current_balance: Number(users_final_amount) }, { new: true });
        let updated_admin = await user.findOneAndUpdate({ account_type: "admin" }, { current_balance: Number(admins_final_amount) }, { new: true })


        // make entry in transaction table 
        let transaction = await Transaction.create({
            transaction_type: "withdraw_from_user_send_to_admin",
            sender_id: updated_user._id,
            receiver_id: updated_admin._id,
            remark: remark,
            sender_type: "user",
            receiver_type: "admin",
            amount: Number(amount_to_send),
            admins_previous_amount: Number(admins_previous_amount),
            users_previous_amount: Number(users_previous_amount),
            admins_final_amount: Number(admins_final_amount),
            users_final_amount: Number(users_final_amount)
        });

        return res.json({
            status: "success",
            message: "Money Withdrawn successfully from users side",
            data: {
                transaction: transaction, user: updated_user, admin: updated_admin
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}


export const setExposureLimit = async (req, res) => {
    try {
        let { old_exposure_limit, new_exposure_limit, transaction_password, user_id } = req.body;

        // check admins transaction password
        let admins_transaction_password = await user.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await user.findOne({ _id: user_id }).select("exposure_limit");
        if (!userExists) {
            return res.json({ message: "No user exists" })
        }

        let admin = await user.findOne({ account_type: "admin" });

        // frontend will do the calculation from their side and we just needs to update the db

        let updated_user = await user.findOneAndUpdate({ _id: user_id }, { exposure_limit: Number(new_exposure_limit) }, { new: true });

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
        let admins_transaction_password = await user.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await user.findOne({ _id: user_id }).select("exposure_limit");
        if (!userExists) {
            return res.json({ message: "No user exists" })
        }

        let admin = await user.findOne({ account_type: "admin" });

        // frontend will do the calculation from their side and we just needs to update the db

        let updated_user = await user.findOneAndUpdate({ _id: user_id }, { credit_ref: Number(new_credit) }, { new: true });

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

        let admins_transaction_password = await user.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await user.findOne({ _id: user_id });
        if (!userExists) {
            return res.status(400).json({ message: "No user exists" })
        }


        let admin = await user.findOne({ account_type: "admin" });

        const salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(new_password, salt);
        let User = await user.findOneAndUpdate({ _id: user_id }, { password: hashedPassword }, { new: true });


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
        const allUsers = await user
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


export const DownloadAccountListExcel = async (req, res) => {
    try {
        const allUsers = await user
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

// get all admin account statement
export const adminAccountStatement = async (req, res) => {
    try {

        let account_type = req.query.account_type || "all"; // all , withdraw/deposit_report 
        let from = req.query.from || "";
        let to = req.query.to || "";
        let client_id = req.query.client_id || "";
        let page = req.query.page ? Number(req.query.page) : 1;
        let limit = req.query.limit ? Number(req.query.limit) : 10;
        let skip = (page - 1) * limit;

        let query = { sender_type: "admin" }

        if (client_id != "") {
            query.receiver_id = client_id; // receiver will be user
        }

        if (account_type != "all") {
            query.transaction_type = account_type;
        }

        if (from != "" && to != "") {
            query.createdAt = {
                $gte: new Date(from),
                $lte: new Date(to)
            }
        }


        let all_admin_statements = await Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        let totalCount = await Transaction.countDocuments(query);

        return res.status(200).json({
            status: "success",
            data: all_admin_statements,
            pagination: {
                limit: limit,
                page: page,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        })
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Account statements didnt came",
                error: error.message,
            });
        }
    }
};

export const changeUserStatus = async (req, res) => {
    try {
        let { is_active, can_bet, transaction_password, user_id } = req.body;

        let admins_transaction_password = await user.findOne({ account_type: "admin" }).select("transaction_password")

        let compareTransactionPassword = bcrypt.compareSync(transaction_password, admins_transaction_password.transaction_password);

        if (!compareTransactionPassword) {
            return res.status(400).json({
                message: "Transaction password didn't matched"
            })
        }
        let userExists = await user.findOne({ _id: user_id });
        if (!userExists) {
            return res.status(400).json({ message: "No user exists" })
        }
        //is_active , can_bet
        let updateUser = await user.findOneAndUpdate({ _id: user_id }, {
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
        console.log("requesttttttttt ")
        let page = req.query.page ? Number(req.query.page) : 1;
        let limit = req.query.limit ? Number(req.query.limit) : 10;
        let skip = (page - 1) * limit;
        let filter = req.query.filter || "matched";
        let back_lay = req.query.back_lay || "all"; // back, lay , all

        let query = {};

        if (filter != "") {
            query.bet_status = filter
        }

        if (back_lay != "all") {
            query.bet_type = back_lay
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
        // how many bets have user taken of casino type, sport type and third party type
        // get all the settled bets of those and take their profit loss 
        // and give total per user and final total of the platform 
        // and from to also 

        let from = req.query.from || "";
        let to = req.query.to || "";

        let query = { account_type: "user" };

        if (from != "" && to != "") {
            query.createdAt = { $gte: new Date(from) },
                query.createdAt = { $lte: new Date(to) }
        }

        let search = req.query.search || "";

        if (search != "") {
            query.client_name = new RegExp(`^${search}`, "i");
        }

        let all_users = await user.find(query);

        let overall_casino_amount = 0;
        let overall_sport_amount = 0;
        let overall_third_party_amount = 0;
        let overall_profit_loss = 0;

        all_users = await Promise.all(all_users.map(async (user) => {
            let getAllbetsAmount = await Bet.find({ user_id: user._id, bet_status: "settled" });
            // console.log("getAllbetsAmountgetAllbetsAmountgetAllbetsAmount",getAllbetsAmount)
            let casino_amount = 0;
            let sport_amount = 0;
            let third_party_amount = 0;
            let users_profit_loss = 0;

            //// profit_loss,bet_sub_type:casino,sport,third_party
            getAllbetsAmount.map((bet) => {
                console.log("code came in this blockkkk",bet)
                if (bet.bet_sub_type == "casino") {
                    casino_amount += Number(bet.profit_loss)
                } else if (bet.bet_sub_type == "sport") {
                    sport_amount += Number(bet.profit_loss)
                    console.log("casino_amountcasino_amount",sport_amount)
                } else if (bet.bet_sub_type == "third_party") {
                    third_party_amount += Number(bet.profit_loss)
                }
            })

            // working till here 
            
            users_profit_loss = casino_amount + sport_amount + third_party_amount

            overall_casino_amount += casino_amount,
                overall_sport_amount += sport_amount,
                overall_third_party_amount += third_party_amount,
                overall_profit_loss += users_profit_loss

            return { ...user.toObject(), users_profit_loss, casino_amount, sport_amount, third_party_amount }
        }))




        return res.status(200).json({
            success: true,
            data: {
                all_users,
                overall_casino_amount, overall_sport_amount, overall_third_party_amount, overall_profit_loss
            },
            message: "All Users Profit Loss fetched successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
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
































































