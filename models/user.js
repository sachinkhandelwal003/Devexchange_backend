import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true, // ✅ IMPORTANT: Taaki sabka username alag ho
    },

    // ✅ ADDED: Email field (Login ke liye best rehta hai)
    email: {
      type: String,
      required: true,
      unique: true, // Ek email se ek hi account banega
      trim: true,
      lowercase: true, // Taaki 'Admin@gmail.com' aur 'admin@gmail.com' same maane jayein
    },

    // ✅ ADDED: Password field (Hash save karne ke liye)
    password: {
      type: String,
      required: true,
    },

    creditRef: {
      type: String,
      default: "",
    },

    userStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    balanceStatus: {
      type: String,
      enum: ["good", "warning", "blocked"],
      default: "good",
    },

    exposureLimit: {
      type: Number,
      default: 0,
    },

    defaultPercent: {
      type: Number,
      default: 0,
    },

    accountType: {
      type: String,
      enum: ["admin", "user", "agent"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;