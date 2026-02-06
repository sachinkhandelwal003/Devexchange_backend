// deposite_withdraw_reports , sport_report , casino_reports , third_party_casino_reports

import mongoose from "mongoose";

const accountStatementCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

let AccountStatementCategory = mongoose.model("AccountStatementCategory", accountStatementCategorySchema, "AccountStatementCategory");
export default AccountStatementCategory;