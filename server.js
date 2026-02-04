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
    const adminPassword = "admin123"; 

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new User({
        username: "SuperAdmin",
        email: adminEmail,
        password: hashedPassword,
        accountType: "admin",
        userStatus: "active",
        creditRef: "ADMIN001",
        exposureLimit: 1000000,
      });
      await newAdmin.save();
      console.log("✅ Admin account created: admin@gmail.com / admin123");
    } else {
      console.log("ℹ️ Admin account already exists.");
    }
  } catch (error) {
    console.error("❌ Admin creation error:", error.message);
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
