# Deploy Server to Cloudflare Workers

## Changes Made

Your Express.js server has been converted to a Cloudflare Worker. Key changes:

1. **Email Service**: Switched from Nodemailer to MailChannels (free on Cloudflare)
2. **Storage**: Using Cloudflare KV for temporary password storage
3. **No SMTP needed**: MailChannels handles email delivery

## Deployment Steps

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create KV Namespace
```bash
cd server
wrangler kv:namespace create TEMP_PASSWORDS
```

Copy the `id` from the output and update it in `wrangler.toml`

### 4. Set Environment Variables
```bash
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
```

Paste the values when prompted.

### 5. Update Frontend URL
Edit `wrangler.toml` and replace `https://your-client-app.pages.dev` with your actual Cloudflare Pages URL.

### 6. Deploy
```bash
wrangler deploy
```

Your API will be available at: `https://wordzy-server.YOUR_SUBDOMAIN.workers.dev`

## Update Client

Update your client's API endpoint to point to the Worker URL:
```javascript
const API_URL = 'https://wordzy-server.YOUR_SUBDOMAIN.workers.dev';
```

## Notes

- MailChannels is free and works automatically on Cloudflare Workers
- No SMTP configuration needed
- KV storage is free for up to 100,000 reads/day
- Workers free tier: 100,000 requests/day
