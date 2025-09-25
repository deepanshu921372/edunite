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
    console.log(`Approval email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
};

module.exports = {
  sendApprovalEmail,
  transporter
};