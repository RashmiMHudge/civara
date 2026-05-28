//import { ExplainVerbosity } from "mongodb";
import mongoose from "mongoose";
const visitorSchema = new mongoose.Schema(
    {
        resident: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            name: String,
            block: String,
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
        source: {
            type: String,
            enum: ["RESIDENT_INVITE", "SECURITY_REQUEST"],
            default: "RESIDENT_INVITE"
        },
        visitType: {
            type: String,
            enum: ["GUEST", "DELIVERY", "SERVICE", "OTHER"],
            default: "GUEST"
        },
        status: {
            type: String,
            enum: [
                "EXPECTED",
                "PENDING_APPROVAL",
                "APPROVED",
                "DENIED",
                "CHECKED_IN",
                "CHECKED_OUT",
                "EXPIRED"
            ],
            default: "EXPECTED"
        },
        securityRequest: {
            requestedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            requestedByName: String,
            gate: String,
            notes: String,
            requestedAt: Date
        },
        residentDecisionAt: Date,
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
