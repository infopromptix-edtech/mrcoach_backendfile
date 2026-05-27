const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  // Use a fallback test account if env credentials are not fully defined
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE || 'gmail';

  if (!user || !pass) {
    console.warn('⚠️ Warning: EMAIL_USER or EMAIL_PASS not set in environment variables. Email will only be logged to console for testing.');
    console.log(`✉️ Email Mock sent to: ${to}\nSubject: ${subject}\nBody:\n${text}`);
    return { success: true, mock: true };
  }

  const transporter = nodemailer.createTransport({
    service,
    auth: { user, pass }
  });

  const mailOptions = {
    from: `"MrCoach" <${user}>`,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Nodemailer failed to send email:', error);
    // Logging fallback to console so flow doesn't block due to invalid credentials
    console.log(`✉️ Fallback Email Mock (on error) to: ${to}\nSubject: ${subject}\nBody:\n${text}`);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
