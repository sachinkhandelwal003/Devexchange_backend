import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

// 1. Files Import karein (Routes aur Utils)
import userRoutes from "./Routes/userRoute.js";
import createAdminAccount from "./utils/adminSetup.js"; // Admin create karne wala function yahan import hoga

// 2. Configuration Setup
dotenv.config(); // .env file read karne ke liye
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares (Global Rules)
app.use(express.json()); // JSON data padhne ke liye
app.use(express.urlencoded({ extended: true })); // Form data ke liye
app.use(cors({})); // Frontend ko allow karne ke liye

// 4. Routes Define karein
// Jab bhi koi '/api/users' par request karega, wo userRoutes file mein jayega
app.use(morgan("dev"));
app.use("/api/users", userRoutes);
app.get("/",(req, res) => {
  res.send("Welcome to the DevExchange API!");
});

// 5. Database Connection & Server Start
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb")
  .then(() => {
    console.log("✅ Connected to MongoDB");

    // 👉 Yahan call karein Admin banane wala function
    // Ye tabhi chalega jab DB connect ho jayega
    createAdminAccount(); 

    // Server start karein
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });