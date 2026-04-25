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

    // Handle new image uploads if provided
    let imageUrls: string[] = property.images;

    if (req.files && req.files.images) {
      imageUrls = [];
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
        imageUrls.push(result.secure_url);
      }
    }

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
      images: imageUrls,
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