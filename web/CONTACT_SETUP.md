# Contact Form Setup

The contact page uses SMTP to send emails to contacts@eonmun.com.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="EONMUN Contact Form <your-email@gmail.com>"
```

## How to configure SMTP:

### For Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Go to Google Account settings > Security > App passwords
3. Use your Gmail address as SMTP_USER
4. Use the generated app password as SMTP_PASS
5. Use `smtp.gmail.com` as SMTP_HOST and `587` as SMTP_PORT

### For other providers:
- **Outlook/Hotmail**: `smtp.live.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587`
- **Custom SMTP**: Use your provider's SMTP settings

## Features:

- Clean, responsive contact form with dark mode support
- Server-side form validation and email sending via SMTP
- Proper error handling and user feedback
- Integration with existing EONMUN design system
- Accessible form inputs with icons
- Progressive enhancement with Next.js server actions