import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT) || 2525,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: String(process.env.SMTP_USER || "").trim(),
      pass: String(process.env.SMTP_PASS || "").replace(/\s+/g, "")
    }
  });

export const sendMail = async ({ to, subject, text, html, replyTo }) => {
  if (!to) throw new Error("Email recipient is required");

  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!smtpUser || !smtpPass) {
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
    html,
    replyTo: replyTo || undefined
  };

  const transporter = createTransporter();
  const info = await transporter.sendMail(mailOptions);
  return info;
};
