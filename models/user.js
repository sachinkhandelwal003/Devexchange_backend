import mongoose from "mongoose";
// client_name , password , full_name,city,phone_number, account_type , credit_ref, comission_setting_upline, 
// comission_setting_downline,comission_setting_our , partnership_upline, partnership_downline, partnership_our ,
// transaction_password

const userSchema = new mongoose.Schema(
  {
    client_name: {
      type: String,
      required: false,
      trim: true,
    },

    password: {
      type: String,
      required: false,
    },

    full_name: {
      type: String,
      required: false,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    phone_number: {
      type: String,
      required: false,

    },

    account_type: {
      type: String,
      enum: ["agent", "user", "admin", "admin_staff"],
      default: "user",
    },

    credit_ref: { // credit reference
      type: Number,
      default: 0,
      required: false
    },

    comission_setting_upline: { type: Number, default: 0, required: false, },
    comission_setting_downline: { type: Number, default: 0, required: false, },
    comission_setting_our: { type: Number, default: 0, required: false, },

    partnership_upline: { type: Number, default: 0, required: false, },
    partnership_downline: { type: Number, default: 0, required: false, },
    partnership_our: { type: Number, default: 0, required: false, },
    exposure_limit: { // exposure limit set by admin
      type: Number,
      default: 0,
      required: false
    },
    last_credit: {
      type: Number,
      default: 0,
      required: false
    },
    current_balance: { // current balance
      type: Number,
      default: 0,
      required: false
    },
    is_active: {
      type: Boolean,
      default: false,
      required: false
    },
    is_demo: {
  type: Boolean,
  default: false,required: false

},

    can_bet: {
      type: Boolean,
      default: false,
      required: false
    },
    casino_balance: {
      type: Number,
      default: 0,
      required: false
    },
    transaction_password: {
      type: String,
      required: false,
      default: ""
    },
    priviliges: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Priviliges",
      }],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
