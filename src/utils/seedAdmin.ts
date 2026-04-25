import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../models/User"
import { log } from "console"

dotenv.config()


const seedAdmin = async () =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI!)
        console.log("Connected to MongoDB");

        const adminEmail = process.env.ADMIN_EMAIL || "adloebrandd@gmail.com"
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

        // check if admin alreadt exists
        const existing = await User.findOne({email: adminEmail})
        if(existing){
            console.log("Admin user already exists");
            process.exit(0)
            
        }

        // create admin - password is hashed automatically

        const admin = await User.create({
            name: "Admin",
            email: adminEmail,
            password: adminPassword,
            role: "admin",
            isVerified: true, //admin does not need email verification
        })
        console.log(`Admin created: ${admin.email}`);
        console.log(`Role:: ${admin.role}`);
        console.log(`You can now log in with these credentials in the frontend`);
        process.exit(0)
        
    } catch (error) {
        console.error("Seeder error:", error)
        process.exit(1)
    }
}

seedAdmin()