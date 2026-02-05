import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    // 1. Get token from header
    let user = req.user;
    console.log("userrrrrrrrrr in verifyAdmin", user);
    if(user.role!="admin"){
      return res.status(403).json({
        success: false,
        message: "Access denied for non admin users",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
