import mongoose from "mongoose";

const accountStatementSchema = new mongoose.Schema(
    {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            default: null
        },
        credit: {
            type: Number,
            default: 0,
            required: false
        },
        debit: {
            type: Number,
            default: 0,
            required: false
        },
        pts: {
            type: Number,
            default: 0,
            required: false
        },
        remark: {
            type: String,
            default: "",
            required: false
        }
    },
    { timestamps: true }
);

let AccountStatement = mongoose.model("AccountStatement", accountStatementSchema, "AccountStatement");
export default AccountStatement;