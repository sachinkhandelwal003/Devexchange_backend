export const verifyAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Allow both admin and agent
    if (user.role !== "admin" && user.role !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};