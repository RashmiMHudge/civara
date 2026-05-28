import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT) || 2525,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

export const sendMail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error("Email recipient is required");

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return {
      skipped: true,
      reason: "SMTP credentials are not configured"
    };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@civara.com",
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
