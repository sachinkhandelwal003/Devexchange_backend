import jwt from "jsonwebtoken";
import user from "../models/user.js";

export const  verifyUser = async (req, res, next) => {
    try {
        // 1. Get token from header

        let userExists = await user.findOne({
            _id: req.user.id,

        })

        if (!userExists) {
            return res.status(400).json({
                success: false,
                message: "No user found",
            });
        }
        req.user = userExists;
        next();//id , role 
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};



