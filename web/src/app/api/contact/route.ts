import { NextRequest, NextResponse } from 'next/server';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get Mailgun configuration from environment variables
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;

    if (!mailgunApiKey || !mailgunDomain) {
      console.error('Mailgun configuration missing');
      return NextResponse.json(
        { error: 'Email service configuration error' },
        { status: 500 }
      );
    }

    // Initialize Mailgun client
    const mg = mailgun.client({
      username: 'api',
      key: mailgunApiKey,
    });

    // Prepare email content
    const emailSubject = `New Contact Form Submission from ${name}`;
    const emailText = `
Name: ${name}
Email: ${email}

Message:
${message}

---
This message was sent from the EONMUN contact form.
    `.trim();

    const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">New Contact Form Submission</h2>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
  </div>
  
  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #333; margin-top: 0;">Message:</h3>
    <p style="white-space: pre-wrap; color: #555;">${message}</p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
  <p style="font-size: 12px; color: #6c757d;">
    This message was sent from the EONMUN contact form.
  </p>
</div>
    `.trim();

    // Send email using Mailgun
    const emailData = {
      from: `EONMUN Contact Form <noreply@${mailgunDomain}>`,
      to: 'contacts@eonmun.com',
      'reply-to': email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };

    await mg.messages.create(mailgunDomain, emailData);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}