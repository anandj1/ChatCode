
const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/email');
const { authenticateToken } = require('../middleware/auth');

// Logo URL for emails
const logoUrl = 'https://ibb.co/XrdWcc3H';

// Send a contact form email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html, name, email, message } = req.body;
    
    // Handle contact form submission
    if (name && email && message) {
      const result = await sendEmail({
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: 'New Contact Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${logoUrl}" alt="ChatCode Logo" style="width: 120px; height: auto;" />
            </div>
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message}</p>
          </div>
        `
      });
      
      if (result) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ success: false, error: 'Failed to send email' });
      }
    }
    
    // Handle direct email sending with authentication
    if (req.headers.authorization) {
      await authenticateToken(req, res, async () => {
        // If user is authenticated, they can send emails
        if (!to || !subject) {
          return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        // Add logo to HTML if not already present
        let emailHtml = html;
        if (html && !html.includes(logoUrl)) {
          emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${logoUrl}" alt="ChatCode Logo" style="width: 120px; height: auto;" />
              </div>
              ${html}
            </div>
          `;
        }
        
        const result = await sendEmail({ to, subject, text, html: emailHtml });
        
        if (result) {
          return res.status(200).json({ success: true });
        } else {
          return res.status(500).json({ success: false, error: 'Failed to send email' });
        }
      });
    } else {
      // Unauthenticated requests are not allowed for direct email sending
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;