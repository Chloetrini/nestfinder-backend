import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";
import { deleteEnquiry, getEnquiries, submitEnquiry, updateEnquiryStatus } from "../controllers/enquiryController";

const router = Router()

router.post("/", submitEnquiry)
router.get("/",protect,adminOnly ,getEnquiries)
router.put("/:id", protect,adminOnly,updateEnquiryStatus)
router.delete("/:id", protect,adminOnly,deleteEnquiry)

export default router