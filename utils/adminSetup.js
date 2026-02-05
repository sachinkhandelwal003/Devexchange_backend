// File: utils/adminSetup.js

import User from "../models/user.js"; // Apna User model import karein
import bcrypt from "bcryptjs"; // Password hash karne ke liye

const createAdminAccount = async () => {
  try {
    const adminEmail = "admin@gmail.com";
    const adminPassword = "admin123";

    // 1. Check karein ki Admin pehle se hai ya nahi
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      
      // 2. Agar nahi hai, to password hash karein
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // 3. Naya Admin object banayein (Saari required fields ke saath)
      const newAdmin = new User({
        username: "SuperAdmin",
        email: adminEmail,
        password: hashedPassword,
        accountType: "admin",       // 👈 Sabse important field
        userStatus: "active",
        creditRef: "ADMIN001",      // Aapke schema ke mutabik
        exposureLimit: 1000000,     // Default limit
        balanceStatus: 0,
        defaultPercent: 100
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