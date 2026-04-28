import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import Property from "../models/Property";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/authMiddleware";

// GET ALL PROPERTIES
export const getProperties = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const properties = await Property.find({ isDraft: false }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL PROPERTIES PLUS ADMIN INCLUDING DRAFTS

export const getAllPropertiesAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// get single property

export const getProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }
    res.status(200).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// create property
export const createProperty = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      propertyName,
      price,
      propertyDescription,
      propertyType,
      sale,
      city,
      state,
      fullAddress,
      bedrooms,
      bathroom,
      longitude,
      latitude,
      size,
      amenities,
      isFeatured,
      isDraft,
      agentName,
      agentPhone,
      discount,
    } = req.body;
   

 const existingName = await   Property.findOne({propertyName});
if(existingName){
    res.status(400).json({message: "Title already exists"})
}
// If they get past these, the property saves!

   
    // Upload images to Cloudinary
    const imageUrls: string[] = [];

    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of files as UploadedFile[]) {
        const result = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "nestfinder/properties",
                  transformation: [{ width: 1200, quality: "auto" }],
                },
                (error, result) => {
                  if (error || !result) reject(error);
                  else resolve(result);
                },
              )
              .end(file.data);
          },
        );
        imageUrls.push(result.secure_url);
      }
    }

    // Parse amenities sent as JSON string from frontend
    let parsedAmenities: string[] = [];
    if (amenities) {
      try {
        parsedAmenities =
          typeof amenities === "string" ? JSON.parse(amenities) : amenities;
      } catch {
        parsedAmenities = [];
      }
    }

    const property = await Property.create({
      propertyName,
      price: Number(price),
      propertyDescription,
      propertyType,
      sale,
      location: { city, state, fullAddress },
      propertyDetails: {
        bedrooms: Number(bedrooms) || 0,
        bathroom: Number(bathroom) || 0,
        size: Number(size) || 0,
      },
      coordinates: {
        longitude: Number(longitude) || 0,
        latitude: Number(latitude) || 0,
      },
      
      images: imageUrls,
      amenities: parsedAmenities,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isDraft: isDraft === "true",
      agentName: agentName || "NestFinder Agent",
      agentPhone: agentPhone || "+234 800 000 0000",
      discount: discount || "",
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message:
        isDraft === "true"
          ? "Property saved to drafts"
          : "Property published successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// update property


export const updateProperty = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    const {
      propertyName,
      price,
      propertyDescription,
      propertyType,
      sale,
      city,
      state,
      fullAddress,
      bedrooms,
      bathroom,
      size,
      longitude,
      latitude,
      amenities,
      isFeatured,
      isDraft,
      agentName,
      agentPhone,
      discount,
    } = req.body;


let existingImages: string[] = [];
if (req.body.existingImages) {
  try {
    // We check if it's already an array or a JSON string
    existingImages = typeof req.body.existingImages === "string" 
      ? JSON.parse(req.body.existingImages) 
      : req.body.existingImages;
  } catch (e) {
    existingImages = property.images; 
  }
} else {
  existingImages = property.images; 
}


    // Handle new image uploads if provided
    let newImageUrls: string[] = property.images;

    if (req.files && req.files.images) {
      newImageUrls = [];
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of files as UploadedFile[]) {
        const result = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                { folder: "nestfinder/properties" },
                (error, result) => {
                  if (error || !result) reject(error);
                  else resolve(result);
                },
              )
              .end(file.data);
          },
        );
        newImageUrls.push(result.secure_url);
      }
    }
   // 3. MERGE BOTH: Keep the old ones + Add the new ones
const finalImageUrls = [...existingImages, ...newImageUrls];
    // Parse amenities safely
    let parsedAmenities = property.amenities;
    if (amenities) {
      try {
        parsedAmenities =
          typeof amenities === "string" ? JSON.parse(amenities) : amenities;
      } catch {
        parsedAmenities = property.amenities;
      }
    }

    // Build update object — only include fields that were actually sent
    const updateData: Record<string, unknown> = {
      images:finalImageUrls ,
      amenities: parsedAmenities,
    };

    if (propertyName !== undefined) updateData.propertyName = propertyName;
    if (price !== undefined) updateData.price = Number(price);
    if (propertyDescription !== undefined) updateData.propertyDescription = propertyDescription;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (sale !== undefined) updateData.sale = sale;
    if (agentName !== undefined) updateData.agentName = agentName;
    if (agentPhone !== undefined) updateData.agentPhone = agentPhone;
    if (discount !== undefined) updateData.discount = discount;

    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured === "true" || isFeatured === true;
    }
    if (isDraft !== undefined) {
      updateData.isDraft = isDraft === "true" || isDraft === true;
    }

    // Only update nested location fields that were provided
    if (city !== undefined) updateData["location.city"] = city;
    if (state !== undefined) updateData["location.state"] = state;
    if (fullAddress !== undefined) updateData["location.fullAddress"] = fullAddress;

    // Only update nested propertyDetails fields that were provided
    if (bedrooms !== undefined) updateData["propertyDetails.bedrooms"] = Number(bedrooms);
    if (bathroom !== undefined) updateData["propertyDetails.bathroom"] = Number(bathroom);
    if (size !== undefined) updateData["propertyDetails.size"] = Number(size);

 // Only update nested coordinates fields that were provided
    if (longitude !== undefined) updateData["coordinates.longitude"] = Number(longitude);
    if (latitude!== undefined) updateData["coordinates.latitude"] = Number(latitude);
    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },  // Use $set to avoid wiping untouched fields
      { returnDocument:"after", runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      property: updated,
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && {
        error: (error as Error).message,
      }),
    });
  }
};


// DELETE
export const deleteProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- DASHBOARD STATS CONTROLLER ----
// This function calculates real statistics for the admin dashboard.
// It compares current counts with last month's counts to calculate percentage change.
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the current date and time
    const now = new Date();

    // Get the first day of the current month (e.g. April 1, 2026)
    // This is used as a dividing line between "this month" and "last month"
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get the first day of last month (e.g. March 1, 2026)
    // We use this to count how many properties existed before this month started
    // the -1 means Create a date for the 1st day of the month before this one in the current year.
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ---- TOTAL PROPERTIES ----
    // Count ALL properties in the database (no filter)
    const totalProperties = await Property.countDocuments();

    // Count properties that were created BEFORE this month started
    // DATABASE LOGIC: { $lt: startOfThisMonth }
    // $lt stands for "Less Than". 
    // It tells the database: "Only count items where the creation date is EARLIER than the first of this month."
    // This gives us last month's total so we can compare
    const lastMonthProperties = await Property.countDocuments({ 
      createdAt: { $lt: startOfThisMonth } // $lt means "less than" (before this month)
    });

    // ---- ACTIVE LISTINGS ----
    // Count properties that are published (not drafts)
    const activeListings = await Property.countDocuments({ isDraft: false });

    // Count published properties that existed before this month
    // Uses $lt ("Less Than") to find properties older than the current month
    const lastMonthActive = await Property.countDocuments({ 
      isDraft: false, 
      createdAt: { $lt: startOfThisMonth } 
    });

    // ---- PENDING PROPERTIES (DRAFTS) ----
    // Count properties that are saved as drafts (not yet published)
    const pendingProperties = await Property.countDocuments({ isDraft: true });

    // Count draft properties that existed before this month
    // Uses $lt ("Less Than") to ignore anything added this month
    const lastMonthPending = await Property.countDocuments({ 
      isDraft: true, 
      createdAt: { $lt: startOfThisMonth } 
    });
    // ---- DATABASE OPERATOR CHEAT SHEET ----
    /*
       $lt  -> "Less Than"          (Earlier/Smaller than the value)
       $gt  -> "Greater Than"       (Later/Bigger than the value)
       $lte -> "Less Than or Equal" (Up to and including the value)
       $gte -> "Greater Than or Equal" (From this value onwards)
    */

    // ---- PERCENTAGE CALCULATOR ----
    // This function calculates the percentage change between current and previous counts
    // Formula: ((current - previous) / previous) * 100
    // Example: current = 10, previous = 8 → ((10 - 8) / 8) * 100 = +25%
    // Example: current = 6, previous = 8 → ((6 - 8) / 8) * 100 = -25%
    // Special case: if previous is 0 (no data last month), 
    //   return 100% if there are current items, or 0% if there are none
    const calcPercent = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // ---- SEND RESPONSE ----
    // Return all stats to the frontend
    // Each stat includes:
    //   count  → the current total number
    //   percent → the percentage change compared to last month (positive = up, negative = down)
    res.status(200).json({
      success: true,
      stats: {
        totalProperties: { 
          count: totalProperties, 
          percent: calcPercent(totalProperties, lastMonthProperties) 
        },
        activeListings: { 
          count: activeListings, 
          percent: calcPercent(activeListings, lastMonthActive) 
        },
        pendingProperties: { 
          count: pendingProperties, 
          percent: calcPercent(pendingProperties, lastMonthPending) 
        },
      }
    });
  } catch (error) {

    res.status(500).json({ success: false, message: "Server error" });
  }
};