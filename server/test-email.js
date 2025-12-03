import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing SMTP Configuration...\n');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const testEmail = {
  from: `"Wordzy Admin Test" <${process.env.SMTP_USER}>`,
  to: process.env.SMTP_USER, // Send to yourself
  subject: '✅ SMTP Test - Wordzy Admin',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ SMTP Test Successful!</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Congratulations! Your SMTP configuration is working correctly.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Host: ${process.env.SMTP_HOST}</li>
          <li>Port: ${process.env.SMTP_PORT}</li>
          <li>User: ${process.env.SMTP_USER}</li>
        </ul>
        <p>You're ready to use the password reset feature!</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #64748b; font-size: 12px;">This is a test email from Wordzy Admin SMTP setup.</p>
      </div>
    </div>
  `,
};

console.log('📧 Sending test email to:', process.env.SMTP_USER);
console.log('⏳ Please wait...\n');

try {
  const info = await transporter.sendMail(testEmail);
  console.log('✅ SUCCESS! Email sent successfully!');
  console.log('📬 Message ID:', info.messageId);
  console.log('\n✨ Check your inbox (and spam folder) for the test email.');
  console.log('🚀 Your SMTP configuration is ready to use!\n');
} catch (error) {
  console.error('❌ ERROR: Failed to send email\n');
  console.error('Error details:', error.message);
  console.error('\n💡 Common issues:');
  console.error('   - Check SMTP_USER and SMTP_PASS in .env file');
  console.error('   - Make sure you\'re using an App Password (not regular password)');
  console.error('   - Verify 2-Step Verification is enabled on your Google account');
  console.error('   - Check if "Less secure app access" is enabled (if needed)\n');
}
