import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/authRoutes"
import propertyRoutes from "./routes/propertyRoutes"
import enquiryRoutes from "./routes/enquiryRoutes"
import cors from "cors"
// Load environment variables first
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS — allows frontend to talk to backend
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://nestfinder-real-estate-ljlj.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON
app.use(express.json());

// Parse form data
app.use(express.urlencoded({extended:true}))



// Handle file uploads — for property images
app.use(
  fileUpload({
    useTempFiles:false,
    limits: { fileSize: 10 * 1024 * 1024 },//10 mb per file
    abortOnLimit:true
  })
);

// ============================================================
// ROUTES
// ============================================================
app.use("/api/auth",authRoutes)
app.use("/api/properties",propertyRoutes)
app.use("/api/enquiries",enquiryRoutes)

// Health check — to confirm server nis running
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "NestFinder Pro API is running",
  });
});



// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 7200;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Frontend URL: ${process.env.CLIENT_URL}`);
});

export default app;