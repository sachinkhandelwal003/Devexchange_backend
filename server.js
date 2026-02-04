import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from  "./models/user.js"
import userRoutes from "./Routes/userRoute.js";



dotenv.config();

const createAdminAccount = async () => {
  try {
    const adminEmail = "admin@gmail.com";
    const adminPassword = "admin123"; // Ise .env mein rakhna behtar hai

    // 1. Check karein ki admin exist karta hai ya nahi
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // 2. Agar nahi hai, toh password hash karein
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // 3. Naya Admin Object banayein
      const newAdmin = new User({
        username: "SuperAdmin",
        email: adminEmail,
        password: hashedPassword,
        accountType: "admin", // Role set karein
        userStatus: "active",
        creditRef: "ADMIN001",
        balanceStatus: "good",
        exposureLimit: 100000, // Admin ke liye high limit
        defaultPercent: 0
      });

      await newAdmin.save();
      console.log("✅ Admin account created successfully!");
    } else {
      console.log("ℹ️ Admin account already exists. Ready to login.");
    }
  } catch (error) {
    console.error("❌ Error creating admin account:", error.message);
  }
};

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));



app.use(cors());
app.use("/api/users", userRoutes);
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb")
    .then(() => {
        console.log("Connected to the  MongoDB")
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});
