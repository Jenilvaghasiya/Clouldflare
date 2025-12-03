// Generate random password
function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Send email using MailChannels
async function sendEmail(to, tempPassword, resetLink) {
  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@wordzy.app', name: 'Wordzy Admin' },
      subject: 'Password Reset - Wordzy Admin',
      content: [{
        type: 'text/html',
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .password-box { background: white; padding: 20px; border-radius: 8px; border: 2px solid #3b82f6; margin: 20px 0; text-align: center; }
              .password { font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 2px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your Wordzy Admin account.</p>
                
                <div class="password-box">
                  <p style="margin: 0 0 10px 0; color: #64748b;">Your temporary password:</p>
                  <div class="password">${tempPassword}</div>
                </div>

                <div class="warning">
                  <strong>⚠️ Important:</strong> This temporary password will expire in 1 hour. Please change it immediately after logging in.
                </div>

                <p>You can also click the button below to go directly to the password change page:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Change Password Now</a>
                </div>

                <p><strong>Steps to reset your password:</strong></p>
                <ol>
                  <li>Use the temporary password above to log in</li>
                  <li>Click on "Change password" link</li>
                  <li>Enter the temporary password and set a new password</li>
                </ol>

                <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>

                <div class="footer">
                  <p>This is an automated email from Wordzy Admin</p>
                  <p>© ${new Date().getFullYear()} Wordzy Admin. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }
}

// Get user by email using Firebase REST API
async function getUserByEmail(email, apiKey, projectId) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: [email] }),
    }
  );

  const data = await response.json();
  if (!data.users || data.users.length === 0) {
    return null;
  }
  return data.users[0];
}

// Update user password using Firebase REST API
async function updateUserPassword(localId, password, apiKey) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        localId: localId,
        password: password,
        returnSecureToken: false,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update password');
  }
  return await response.json();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', message: 'Server is running' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test endpoint
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        hasApiKey: !!env.FIREBASE_API_KEY,
        hasProjectId: !!env.FIREBASE_PROJECT_ID,
        hasKV: !!env.TEMP_PASSWORDS
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forgot password endpoint
    if (url.pathname === '/api/forgot-password' && request.method === 'POST') {
      try {
        const { email } = await request.json();

        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user exists
        const user = await getUserByEmail(email, env.FIREBASE_API_KEY, env.FIREBASE_PROJECT_ID);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'No account found with this email address' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Generate temporary password
        const tempPassword = generatePassword();
        const resetToken = generateToken();

        // Store temp password in KV (with 1 hour expiry)
        await env.TEMP_PASSWORDS.put(resetToken, JSON.stringify({
          email,
          tempPassword,
          expires: Date.now() + 3600000,
        }), { expirationTtl: 3600 });

        // Update Firebase user password
        await updateUserPassword(user.localId, tempPassword, env.FIREBASE_API_KEY);

        // Create reset link
        const resetLink = `${env.FRONTEND_URL}?token=${resetToken}`;

        // Send email
        await sendEmail(email, tempPassword, resetLink);

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Password reset email sent successfully. Please check your inbox.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Forgot password error:', error);
        return new Response(JSON.stringify({ error: 'Failed to send password reset email' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Verify reset token endpoint
    if (url.pathname.startsWith('/api/verify-token/') && request.method === 'GET') {
      const token = url.pathname.split('/').pop();
      const data = await env.TEMP_PASSWORDS.get(token);

      if (!data) {
        return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const parsed = JSON.parse(data);
      if (Date.now() > parsed.expires) {
        await env.TEMP_PASSWORDS.delete(token);
        return new Response(JSON.stringify({ error: 'Reset token has expired' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        email: parsed.email,
        tempPassword: parsed.tempPassword 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
