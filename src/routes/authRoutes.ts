import { Router } from "express";
import { forgotPassword, getMe, getUsersCount, login, register, resetpassword, verifyEmail } from "../controllers/authController";
import { adminOnly, protect } from "../middleware/authMiddleware";

const router = Router()


// Public routes — no token needed
router.post("/register", register)
router.get("/verify-email/:token", verifyEmail)
router.post("/login",login)
router.post("/forgot-password",forgotPassword)
router.post("/reset-password/:token",resetpassword)

// token required
router.get("/users/count",protect,adminOnly,getUsersCount)

router.get("/me",protect,getMe)

export default router