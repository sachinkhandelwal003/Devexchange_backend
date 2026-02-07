import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    transaction_type: {
        type: String,
        default: "", 
        required: false
    },// deposit_to_user_from_admin , withdraw_from_user_send_to_admin , set_user_exposure_limit, admin_credit_to_user 
    sender_id: {
        type: String,
        default: "",
        required: false
    },
    receiver_id: {
        type: String,
        default: "",
        required: false
    },
    sender_type: {
        type: String,
        default: "",
        required: false
    },
    receiver_type: {
        type: String,
        default: "",
        required: false
    },
    amount: {
        type: Number,
        default: 0,
        required: false
    },
    remark: {
        type: String,
        default: "",
        required: false
    },
    old_exposure_limit: {
        type: Number,
        default: 0,
        required: false
    },
    new_exposure_limit: {
        type: Number,
        default: 0,
        required: false
    },
    old_credit: {
        type: Number,
        default: 0,
        required: false
    },
    new_credit: {
        type: Number,
        default: 0,
        required: false
    }
})


const Transaction = mongoose.model("Transaction",transactionSchema,"Transaction");

export default Transaction;