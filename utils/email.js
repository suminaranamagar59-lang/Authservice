// utils/email.js
// Handles sending verification and password reset emails using Nodemailer

const nodemailer = require("nodemailer");

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password (not your real password)
  },
});

/**
 * Sends an email verification link to the newly registered user
 * @param {string} toEmail - Recipient email address
 * @param {string} token - Unique verification token
 */
const sendVerificationEmail = async (toEmail, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"SecureAuth System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "✅ Verify Your Email Address",
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 520px; margin: auto; background: #f9f9f9; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e0c97f; margin: 0; font-size: 24px; letter-spacing: 1px;">SecureAuth</h1>
          <p style="color: #aaa; margin: 6px 0 0; font-size: 13px;">Secure User Authentication System</p>
        </div>
        <div style="padding: 36px 30px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #555; line-height: 1.7;">
            Thank you for registering! Please click the button below to verify your email address and activate your account.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #1a1a2e; color: #e0c97f; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #bbb; font-size: 12px;">Or copy this URL into your browser:<br>
            <span style="color: #1a1a2e; word-break: break-all;">${verifyUrl}</span>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset link to the user
 * @param {string} toEmail - Recipient email address
 * @param {string} token - Unique reset token
 */
const sendPasswordResetEmail = async (toEmail, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"SecureAuth System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Reset Your Password",
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 520px; margin: auto; background: #f9f9f9; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e0c97f; margin: 0; font-size: 24px; letter-spacing: 1px;">SecureAuth</h1>
          <p style="color: #aaa; margin: 6px 0 0; font-size: 13px;">Secure User Authentication System</p>
        </div>
        <div style="padding: 36px 30px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #555; line-height: 1.7;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #c0392b; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email — your password won't change.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #bbb; font-size: 12px;">Or copy this URL into your browser:<br>
            <span style="color: #1a1a2e; word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
