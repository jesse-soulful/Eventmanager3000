import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Email service for sending emails
 * Supports SMTP configuration via environment variables
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@eventmanagement.com';

  // If SMTP is not configured, skip email sending (for development)
  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn('⚠️  SMTP not configured. Emails will not be sent.');
    console.warn('⚠️  Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM environment variables.');
    console.warn('⚠️  Password reset tokens will still be created, but emails will not be sent.');
    // Return a mock transporter that doesn't actually send emails
    transporter = nodemailer.createTransport({
      jsonTransport: true, // Use JSON transport which just logs instead of sending
    });
  } else {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const emailTransporter = getTransporter();
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@eventmanagement.com';

    const mailOptions = {
      from: `Event Management 3000 <${smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    
    // Log email info
    const isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    if (!isConfigured) {
      // If using JSON transport (no SMTP configured), log the email content
      console.log('📧 Email would be sent to:', options.to);
      console.log('📧 Subject:', options.subject);
      console.log('📧 Reset URL:', options.html.match(/reset-password\?token=([^"']+)/)?.[1] || 'not found');
    } else {
      console.log('📧 Email sent to:', options.to);
    }
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    // Don't throw error - allow the request to succeed even if email fails
    // The token is still created, user can request again
    console.warn('⚠️  Email sending failed, but password reset token was created.');
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<void> {
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Event Management 3000</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4b5563;">${userName ? `Hi ${userName},` : 'Hi,'}</p>
          <p style="color: #4b5563;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
          <p style="color: #6366f1; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - Event Management 3000',
    html,
  });
}

