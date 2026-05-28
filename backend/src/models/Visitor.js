//import { ExplainVerbosity } from "mongodb";
import mongoose from "mongoose";
const visitorSchema = new mongoose.Schema(
    {
        resident: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            name: String,
            flat: String,
            phone: String
        },
        visitorName: {
            type: String,
            required: true
        },
        phone: String,
        purpose: String,
        visitDate: {
            type: Date,
            required: true
        },
        fromTime: String,
        toTime: String,
        inviteCode: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ["EXPECTED", "APPROVED", "DENIED", "CHECKED_IN", "CHECKED_OUT","EXPIRED"],
            default: "EXPECTED"
        },
        checkInTime: Date,
        checkOutTime: Date,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,   
            ref: "User"
        }
    },
    { timestamps: true }
);  
export default mongoose.model("Visitor", visitorSchema);