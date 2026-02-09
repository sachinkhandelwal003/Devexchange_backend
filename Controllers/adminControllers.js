import user from "../models/user.js";
import Transaction from "../models/transaction.js";
import bcrypt from "bcryptjs"

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
            message:"Money deposit successfully",
            data: {
                transaction: transaction, user: updated_user, admin: updated_admin
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}
































































