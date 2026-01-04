const nodemailer = require('nodemailer');

// Create transporter
// Best practice: Use environment variables for credentials
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail', 'SendGrid', or custom host
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<object>} - Nodemailer info object
 */
exports.sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ EMAIL CONFIG MISSING: Skipping email send. Configure EMAIL_USER and EMAIL_PASS.');
            // Return a mock success so the flow doesn't break
            return { accepted: Array.isArray(to) ? to : [to], rejected: [], messageId: 'mock-id' };
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"ATLAS Notification" <no-reply@atlas.com>',
            to: Array.isArray(to) ? to.join(',') : to,
            subject: subject,
            html: html
        });

        console.log(`📧 Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};

/**
 * Generate a standard email template for ATLAS
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @returns {string} - HTML string
 */
exports.generateEmailTemplate = (title, body) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
            <h1 style="color: #4F46E5; margin: 0;">ATLAS</h1>
        </div>
        <div style="padding: 30px 0;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">${body}</p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
            <p>This is an automated message from the ATLAS system.</p>
        </div>
    </div>
    `;
};
