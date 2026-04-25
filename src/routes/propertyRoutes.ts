import { Router } from "express";
import { createProperty, deleteProperty, getAllPropertiesAdmin, getProperties, getProperty, updateProperty } from "../controllers/propertyController";
import { protect, adminOnly } from "../middleware/authMiddleware";


// property routes
const router = Router()

// public route - no token needed
router.get("/", getProperties)
router.get("/:id", getProperty)


// admin routes
router.get("/admin/all", protect, adminOnly, getAllPropertiesAdmin)

// token needed
router.post("/", protect, adminOnly, createProperty)
router.put("/:id", protect, adminOnly, updateProperty)
router.delete("/:id", protect, adminOnly, deleteProperty)



export default router