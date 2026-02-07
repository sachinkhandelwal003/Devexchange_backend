import Router from "express";
import userRouter from "./userRoute.js"
import adminRouter from "./adminRoute.js"

const router = Router();

router.use("/users",userRouter)
router.use("/admin",adminRouter)

export default router;