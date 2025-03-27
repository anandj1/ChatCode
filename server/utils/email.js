
const nodemailer = require('nodemailer');

// Create transport for sending emails
const createTransporter = () => {
  // For production or when using real email
  if (process.env.NODE_ENV === 'production' || process.env.USE_REAL_EMAIL === 'true') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      }
    });
  } else {
    // For local development with Gmail
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      }
    });
  }
};

// Logo URL for emails
const logoUrl = '/favicon.png';

// Function to send verification email with OTP
const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    console.log(`Sending verification email to ${email} with OTP: ${otp}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '"ChatCode" <noreply@chatcode.io>',
      to: email,
      subject: 'ChatCode - Email Verification',
      text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="ChatCode Logo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover"/>
          </div>
          <h2 style="color: #4f46e5;">Verify Your Email</h2>
          <p>Thank you for signing up with ChatCode! Please use the following code to verify your email address:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This verification code will expire in 10 minutes.</p>
          <p>If you didn't create an account with ChatCode, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Function to send generic emails
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '"ChatCode" <noreply@chatcode.io>',
      to,
      subject,
      text,
      html: html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="ChatCode Logo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover" />
          </div>
          ${text}
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendEmail
};