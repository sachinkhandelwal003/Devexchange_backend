import user from "../models/user.js";
export const getAdminAndUserCurrentBalance = async (req, res) => {
    try {
        let { user_id } = req.query;
        let admin = await user.findOne({ account_type: "admin" }).select("current_balance");
        let userExists = await user.findOne({ _id: user_id }).select("current_balance");

        return res.json({
            status: "success",
            data: {
                admin_current_balance: admin.current_balance,
                user_current_balance: userExists.current_balance
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

export const getExposureLimit = async (req, res) => {
    try {
        let { user_id } = req.query;
        let userExists = await user.findOne({ _id: user_id }).select("exposure_limit");

        return res.json({
            status: "success",
            data: {
                exposure_limit: userExists.exposure_limit
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}




































































