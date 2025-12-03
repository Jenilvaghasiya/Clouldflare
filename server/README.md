# Wordzy Admin - SMTP Password Reset Server

Backend server for handling password reset with SMTP email delivery and auto-generated temporary passwords.

## Features

- ✅ Auto-generates secure temporary passwords
- ✅ Sends beautiful HTML emails via SMTP
- ✅ Updates Firebase user password automatically
- ✅ Temporary password expires in 1 hour
- ✅ Email includes password change link
- ✅ No frontend changes needed after setup

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `admin-wordwave`
3. Click the gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file

### 3. Configure SMTP (Gmail Example)

For Gmail:
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → 2-Step Verification → App passwords
4. Generate an app password for "Mail"
5. Copy the 16-character password

### 4. Create .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000

# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK (from downloaded JSON)
FIREBASE_PROJECT_ID=admin-wordwave
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@admin-wordwave.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the quotes around `FIREBASE_PRIVATE_KEY` and include the `\n` characters.

### 5. Start the Server

Development mode (auto-restart on changes):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### POST /api/forgot-password

Request:
```json
{
  "email": "user@example.com"
}
```

Success Response (200):
```json
{
  "success": true,
  "message": "Password reset email sent successfully. Please check your inbox."
}
```

Error Response (404):
```json
{
  "error": "No account found with this email address"
}
```

### GET /health

Health check endpoint:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## How It Works

1. User enters email on forgot password page
2. Server checks if user exists in Firebase
3. Server generates a secure random password (12 characters)
4. Server updates Firebase user's password
5. Server sends beautiful HTML email with:
   - Temporary password
   - Password change link
   - Expiry warning (1 hour)
6. User logs in with temporary password
7. User clicks "Change password" to set new password

## Email Template

The email includes:
- Professional header with gradient
- Large, easy-to-read temporary password
- Warning about 1-hour expiry
- Direct link to change password
- Step-by-step instructions
- Security notice

## Testing

1. Start the server: `npm run dev`
2. Start the client: `cd ../client && npm run dev`
3. Go to login page and click "Forgot password?"
4. Enter a valid email address
5. Check your email inbox (and spam folder)
6. Use the temporary password to log in
7. Change your password immediately

## Other SMTP Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom SMTP
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Security Notes

- Temporary passwords expire after 1 hour
- Passwords are auto-generated with high entropy
- Firebase handles password hashing
- SMTP credentials stored in .env (never commit!)
- Service account key should be kept secure

## Troubleshooting

**Email not sending:**
- Check SMTP credentials
- Verify app password (not regular password)
- Check spam folder
- Enable "Less secure app access" if using older Gmail

**Firebase errors:**
- Verify service account JSON is correct
- Check Firebase project ID matches
- Ensure private key includes `\n` characters

**Server won't start:**
- Check if port 5000 is available
- Verify all dependencies installed
- Check .env file exists and is formatted correctly

## Production Deployment

For production:
1. Use environment variables instead of .env file
2. Enable HTTPS
3. Use a proper database (Redis/PostgreSQL) instead of in-memory Map
4. Add rate limiting to prevent abuse
5. Set up monitoring and logging
6. Use a dedicated email service (SendGrid, AWS SES, etc.)
