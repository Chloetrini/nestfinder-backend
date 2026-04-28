import mongoose, {Document, Schema} from "mongoose"


// PROPERTY MODEL
// TYPES FIRST
export interface IProperty extends Document{
    propertyName: string,
    price: number,
    propertyDescription: string;
    propertyType: 'Villa' | 'Duplex' | "Apartment" | "Residential" | "House";
    sale: "For Sale" | 'For Rent';
    location: {
        city: string;
        state: string;
        fullAddress: string;
    }
    propertyDetails: {
        bedrooms: number;
        bathroom: number;
        size: number
    };
     coordinates: {
      longitude: number;
      latitude: number
    }

    images: string[];
    amenities: string[];
    isFeatured: boolean;
    isDraft: boolean;
    agentName: string
    agentPhone: string
    discount: string
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date

}


const PropertySchema = new Schema<IProperty>(
  {
    propertyName: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },
    price: {
      type: Number
      
    },
    propertyDescription: {
      type: String
    },
    propertyType: {
      type: String,
      enum: ["Villa", "Duplex", "Apartment", "Residential", "House"]
    },
    sale: {
      type: String,
      enum: ["For Sale", "For Rent"]
    },
    location: {
      city: { type: String},
      state: { type: String},
      fullAddress: { type: String}
    },
    propertyDetails: {
      bedrooms: { type: Number, default: 0 },
      bathroom: { type: Number, default: 0 },
      size: { type: Number, default: 0 },
    },
    coordinates: {
      longitude: { type: Number, default: 0 },
      latitude: { type: Number, default: 0 },
    },

    images: [{ type: String }],
    amenities: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isDraft: { type: Boolean, default: false },
    agentName: { type: String, default: "NestFinder Agent" },
    agentPhone: { type: String, default: "+234 800 000 0000" },
    discount: { type: String, default: "" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model<IProperty>("Property", PropertySchema);
export default Property;