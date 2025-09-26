const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send approval email
const sendApprovalEmail = async (user) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Account Approved - Edunite',
      html: `
        <h2>Congratulations! Your account has been approved</h2>
        <p>Hello ${user.name},</p>
        <p>Your Edunite account has been approved as a <strong>${user.role}</strong>.</p>
        <p>You can now sign in to your dashboard.</p>
        <a href="${frontendUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Sign In Now</a>
        <br><br>
        <p>Best regards,<br>Edunite Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
};

// Send rejection email
const sendRejectionEmail = async (user, adminNotes = '') => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Account Request Rejected - Edunite',
      html: `
        <h2>Account Request Update</h2>
        <p>Hello ${user.name},</p>
        <p>We regret to inform you that your Edunite account request has been rejected.</p>
        ${adminNotes ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #ff6b6b; margin: 15px 0;">
          <strong>Admin Message:</strong><br>
          ${adminNotes}
        </div>
        ` : ''}
        <p>You can reapply by signing in again with your Google account.</p>
        <a href="${frontendUrl}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Try Again</a>
        <br><br>
        <p>If you have any questions, please contact the administrator.</p>
        <p>Best regards,<br>Edunite Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  transporter
};