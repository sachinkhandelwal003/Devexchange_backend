import mongoose from "mongoose";
 // client_name , password , full_name,city,phone_number, account_type , credit_ref, comission_setting_upline, 
 // comission_setting_downline,comission_setting_our , partnership_upline, partnership_downline, partnership_our ,
 // transaction_password

const userSchema = new mongoose.Schema(
  {
    client_name: {
      type: String,
      required: false,
      unique: true,
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
      unique: true,
    },

    account_type: {
      type: String,
      enum: ["agent", "user"],
      default: "user",
    },

    credit_ref: {
      type: Number,
      default: 0,
    },

    comission_setting_upline: {type: Number, default: 0, required: false,},
    comission_setting_downline: {type: Number, default: 0, required: false,},
    comission_setting_our: {type: Number, default: 0, required: false,},

    partnership_upline: {type: Number, default: 0, required: false,},
    partnership_downline: {type: Number, default: 0, required: false,},
    partnership_our: {type: Number, default: 0, required: false,},

    transaction_password: {
      type: String,
      required: false,
      default:""
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
