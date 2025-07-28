# Contact Form Setup

The contact page uses Mailgun API to send emails to contacts@eonmun.com.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```bash
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=your-mailgun-domain.com
```

## How to get Mailgun credentials:

1. Sign up for a Mailgun account at https://www.mailgun.com/
2. Verify your domain or use the sandbox domain for testing
3. Get your API key from the Mailgun dashboard
4. Set your domain (either your verified domain or sandbox domain)

## Features:

- Clean, responsive contact form with dark mode support
- Client-side form validation
- Server-side email sending via Mailgun API
- Proper error handling and user feedback
- Integration with existing EONMUN design system
- Accessible form inputs with icons