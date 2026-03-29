// utils/email.js
// Sends emails using Brevo HTTP API (replaces Nodemailer/Gmail SMTP)
// Render.com blocks outgoing SMTP ports, so we use HTTP API instead

const https = require("https");

const sendEmail = (toEmail, subject, htmlContent) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: { name: "SecureAuth", email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: htmlContent,
    });

    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Brevo API error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
};

const sendVerificationEmail = async (toEmail, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f9f9f9;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
      <div style="background:#1a1a2e;padding:30px;text-align:center;">
        <h1 style="color:#e0c97f;margin:0;font-size:24px;">SecureAuth</h1>
      </div>
      <div style="padding:36px 30px;">
        <h2 style="color:#1a1a2e;margin-top:0;">Verify Your Email</h2>
        <p style="color:#555;line-height:1.7;">Thank you for registering! Click below to verify your email and activate your account.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${verifyUrl}" style="background:#1a1a2e;color:#e0c97f;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Verify Email Address</a>
        </div>
        <p style="color:#999;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
        <p style="color:#bbb;font-size:12px;word-break:break-all;">${verifyUrl}</p>
      </div>
    </div>`;
  await sendEmail(toEmail, "Verify Your Email Address", html);
};

const sendPasswordResetEmail = async (toEmail, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f9f9f9;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
      <div style="background:#1a1a2e;padding:30px;text-align:center;">
        <h1 style="color:#e0c97f;margin:0;font-size:24px;">SecureAuth</h1>
      </div>
      <div style="padding:36px 30px;">
        <h2 style="color:#1a1a2e;margin-top:0;">Reset Your Password</h2>
        <p style="color:#555;line-height:1.7;">Click below to set a new password.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="background:#c0392b;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Reset Password</a>
        </div>
        <p style="color:#999;font-size:13px;">Expires in <strong>1 hour</strong>.</p>
        <p style="color:#bbb;font-size:12px;word-break:break-all;">${resetUrl}</p>
      </div>
    </div>`;
  await sendEmail(toEmail, "Reset Your Password", html);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
