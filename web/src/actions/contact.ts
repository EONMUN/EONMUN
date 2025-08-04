"use server";

import { redirect } from "next/navigation";
import { createTransport } from "nodemailer";

export async function submitContactForm(data: FormData) {
  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const message = data.get("message") as string;

  // Validate required fields
  if (!name || !email || !message) {
    redirect("/contact?error=All fields are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect("/contact?error=Invalid email format");
  }

  // Get SMTP configuration from environment variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    console.error("SMTP configuration missing");
    redirect("/contact?error=Email service configuration error");
  }

  try {
    // Create SMTP transporter
    const transporter = createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
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

    // Send email using SMTP
    const emailOptions = {
      from: smtpFrom,
      to: "contacts@eonmun.com",
      replyTo: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };

    await transporter.sendMail(emailOptions);

    // Redirect to success page
    redirect("/contact?success=true");
  } catch (error) {
    console.error("Error sending email:", error);
    redirect("/contact?error=Failed to send email");
  }
}