import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate random password
function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Store temporary passwords (in production, use Redis or database)
const tempPasswords = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Forgot password endpoint
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in Firebase
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Generate temporary password
    const tempPassword = generatePassword();
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store temp password with expiry (1 hour)
    tempPasswords.set(resetToken, {
      email,
      tempPassword,
      expires: Date.now() + 3600000, // 1 hour
    });

    // Update Firebase user password
    await admin.auth().updateUser(user.uid, {
      password: tempPassword,
    });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}?token=${resetToken}`;

    // Send email
    const mailOptions = {
      from: `"Wordzy Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset - Wordzy Admin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: white; padding: 20px; border-radius: 8px; border: 2px solid #3b82f6; margin: 20px 0; text-align: center; }
            .password { font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 2px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Wordzy Admin account.</p>
              
              <div class="password-box">
                <p style="margin: 0 0 10px 0; color: #64748b;">Your temporary password:</p>
                <div class="password">${tempPassword}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> This temporary password will expire in 1 hour. Please change it immediately after logging in.
              </div>

              <p>You can also click the button below to go directly to the password change page:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Change Password Now</a>
              </div>

              <p><strong>Steps to reset your password:</strong></p>
              <ol>
                <li>Use the temporary password above to log in</li>
                <li>Click on "Change password" link</li>
                <li>Enter the temporary password and set a new password</li>
              </ol>

              <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>

              <div class="footer">
                <p>This is an automated email from Wordzy Admin</p>
                <p>© ${new Date().getFullYear()} Wordzy Admin. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully. Please check your inbox.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

// Verify reset token endpoint
app.get('/api/verify-token/:token', (req, res) => {
  const { token } = req.params;
  const data = tempPasswords.get(token);

  if (!data) {
    return res.status(404).json({ error: 'Invalid or expired reset token' });
  }

  if (Date.now() > data.expires) {
    tempPasswords.delete(token);
    return res.status(410).json({ error: 'Reset token has expired' });
  }

  res.json({ 
    success: true, 
    email: data.email,
    tempPassword: data.tempPassword 
  });
});

// Cleanup expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tempPasswords.entries()) {
    if (now > data.expires) {
      tempPasswords.delete(token);
    }
  }
}, 3600000);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
