import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

// 1. Files Import karein (Routes aur Utils)
import routes from "./Routes/index.js";
import createAdminAccount from "./utils/adminSetup.js"; // Admin create karne wala function yahan import hoga
import AccountStatementCategory from "./models/accountStatementCategories.js";

// 2. Configuration Setup
dotenv.config(); // .env file read karne ke liye
const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json()); // JSON data padhne ke liye
app.use(express.urlencoded({ extended: true })); // Form data ke liye
app.use(cors({})); 


app.use(morgan("dev"));
app.use("/api", routes);
app.get("/", (req, res) => {
  res.send("Welcome to the DevExchange API!");
});


mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb")
  .then(() => {
    console.log("✅ Connected to MongoDB");

    createAdminAccount();


    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });