
const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify the connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('SMTP Connection Error:', error);
    } else {
      console.log('SMTP Connection Success:', success);
    }
  });

  return transporter;
};

// Email logo URL
const logoUrl = 'https://i.ibb.co/JwbcDDyZ/favicon.png';

// Consistent email template styling
const emailStyles = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;',
  header: 'background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;',
  headerTitle: 'color: #ffffff; margin: 0; font-size: 24px;',
  body: 'padding: 30px; background: white; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;',
  otpContainer: 'background: #f8f9fa; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;',
  otpCode: 'color: #007bff; letter-spacing: 8px; font-size: 32px; font-weight: bold; margin: 0;',
  footer: 'text-align: center; margin-top: 20px; color: #666; font-size: 12px;',
  logo: 'width: 100px; height: 100px; border-radius: 50%; object-fit: cover'
};


const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log('Attempting to send email...');
    console.log('To:', to);
    console.log('Subject:', subject);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ChatCode',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendContactEmail = async (name, email, message) => {
  const html = `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <img src="${logoUrl}" alt="ChatCode Logo" style="${emailStyles.logo}" />
        <h1 style="${emailStyles.headerTitle}">New Contact Form Submission</h1>
      </div>
      <div style="${emailStyles.body}">
        <h2 style="color: #444;">Contact Details</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
        <div style="${emailStyles.footer}">
          <p>&copy; ${new Date().getFullYear()} ChatCode. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: process.env.EMAIL_USER,
    subject: `New Contact Form Submission from ${name}`,
    html
  });
};

const sendVerificationEmail = async (email, otp) => {
  try {
    console.log('Sending verification email...');
    console.log('Email:', email);
    console.log('OTP:', otp);
    
    const html = `
      <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
          <img src="${logoUrl}" alt="ChatCode Logo" style="${emailStyles.logo}" />
          <h1 style="${emailStyles.headerTitle}">ChatCode Verification</h1>
        </div>
        <div style="${emailStyles.body}">
          <h2 style="color: #444;">Welcome to ChatCode!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering. To complete your registration, please use the following verification code:
          </p>
          <div style="${emailStyles.otpContainer}">
            <h2 style="${emailStyles.otpCode}">${otp}</h2>
          </div>
          <p style="color: #666; line-height: 1.6;">
            This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          </p>
          <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} ChatCode. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Verify Your ChatCode Account',
      html
    });

    console.log('Verification email sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const html = `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
      
        <h1 style="${emailStyles.headerTitle}">ChatCode Password Reset</h1>
          <img src="https://i.ibb.co/JwbcDDyZ/favicon.png" alt="ChatCode Logo" style="${emailStyles.logo}" />
      </div>
      <div style="${emailStyles.body}">
        <h2 style="color: #444;">Reset Your Password</h2>
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset your password. Use the following code to reset your password:
        </p>
        <div style="${emailStyles.otpContainer}">
          <h2 style="${emailStyles.otpCode}">${resetToken}</h2>
        </div>
        <p style="color: #666; line-height: 1.6;">
          This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.
        </p>
        <div style="${emailStyles.footer}">
          <p>&copy; ${new Date().getFullYear()} ChatCode. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your ChatCode Password',
    html
  });
};

module.exports = {
  sendEmail,
  sendContactEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};