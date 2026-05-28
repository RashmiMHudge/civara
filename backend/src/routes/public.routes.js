import express from "express";
import { sendMail } from "../services/email.service.js";

const router = express.Router();

router.get("/site-contact", async (req, res) => {
  try {
    return res.json({
      contact: {
        name: process.env.PUBLIC_CONTACT_NAME || "Civara Developer",
        email: process.env.PUBLIC_CONTACT_EMAIL || "hudge.rashmi30@gmail.com",
        phone: process.env.PUBLIC_CONTACT_PHONE || "",
        societyName: process.env.PUBLIC_CONTACT_ORG || "Civara",
        societyAddress: process.env.PUBLIC_CONTACT_ADDRESS || "",
        societyContact: process.env.PUBLIC_CONTACT_PHONE || ""
      }
    });
  } catch (error) {
    console.error("Public site contact fetch error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/contact-inquiry", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const senderName = String(name || "").trim();
    const senderEmail = String(email || "").trim().toLowerCase();
    const senderMessage = String(message || "").trim();
    const recipientEmail = process.env.PUBLIC_CONTACT_EMAIL || "hudge.rashmi30@gmail.com";

    if (!senderName || !senderEmail || !senderMessage) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    if (!/^\S+@\S+\.\S+$/.test(senderEmail)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }

    const mailResult = await sendMail({
      to: recipientEmail,
      subject: `New Civara Inquiry from ${senderName}`,
      text: `Name: ${senderName}\nEmail: ${senderEmail}\n\nMessage:\n${senderMessage}`,
      html: `
        <p><strong>Name:</strong> ${senderName}</p>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${senderMessage.replace(/\n/g, "<br />")}</p>
      `,
      replyTo: senderEmail
    });

    if (mailResult?.skipped) {
      return res.status(503).json({
        message: "Email sending is not configured yet. Please add SMTP settings in the backend .env file."
      });
    }

    return res.json({ message: "Inquiry sent successfully" });
  } catch (error) {
    console.error("Public contact inquiry error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to send inquiry"
    });
  }
});

export default router;
