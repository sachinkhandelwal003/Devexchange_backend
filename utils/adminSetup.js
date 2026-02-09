// File: utils/adminSetup.js

import User from "../models/user.js"; // Apna User model import karein
import bcrypt from "bcryptjs"; // Password hash karne ke liye

const createAdminAccount = async () => {
  try {
    const adminEmail = "admin@gmail.com";
    const adminPassword = "Password@123";


    const existingAdmin = await User.findOne({ account_type:"admin" });

    if (!existingAdmin) {

      // 2. Agar nahi hai, to password hash karein
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      let admintransactionPassword = "Password@123";
      const hashedAdminPassword = await bcrypt.hash(admintransactionPassword, 10)


      const newAdmin = new User({
        client_name: "SuperAdmin",
        email: adminEmail,
        password: hashedPassword,
        account_type: "admin",       
        userStatus: "active",
        creditRef: "ADMIN001",      
        exposureLimit: 1000000,     
        balanceStatus: 0,
        defaultPercent: 100,
        transaction_password: hashedAdminPassword
      });

      // 4. Database mein save karein
      await newAdmin.save();
      console.log("✅ Admin account created successfully: admin@gmail.com");

    } else {
      console.log("ℹ️ Admin account already exists.");
    }

  } catch (error) {
    console.error("❌ Error creating admin account:", error.message);
  }
};

export default createAdminAccount;