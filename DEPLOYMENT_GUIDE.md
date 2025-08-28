# AWS Amplify Deployment Guide

## Environment Variables Required

Make sure to set these environment variables in your AWS Amplify console:

### Required Variables:

- `NEXTAUTH_SECRET` - A secure random string for JWT signing
- `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.amplifyapp.com`)
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret

### Optional Variables:

- `DATABASE_URL` - Database connection string (if using external database)
- `AUTH_DISABLE_ADAPTER` - Set to `true` to disable Prisma adapter
- `NODE_ENV` - Set to `production`

## Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Set Application Type to **"Web application"**
6. Add authorized redirect URIs:
   - `https://your-app.amplifyapp.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local development)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Set Environment Variables

Add these to your AWS Amplify environment variables:

```bash
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Deployment Checklist

### Before Deployment:

1. ✅ Set up Google OAuth credentials
2. ✅ Set all required environment variables in Amplify console
3. ✅ Ensure your repository is connected to Amplify
4. ✅ Check that the build settings point to `apps/web` directory

### During Build:

1. ✅ Prisma client generation should complete successfully
2. ✅ Next.js build should complete without errors
3. ✅ Check build logs for any environment variable warnings

### After Deployment:

1. ✅ Test the health check endpoint: `/api/health`
2. ✅ Verify the main page loads without errors
3. ✅ Test Google sign-in flow
4. ✅ Verify user session management

## Troubleshooting

### Common Issues:

1. **Internal Server Error (500)**
   - Check environment variables are set correctly
   - Verify `NEXTAUTH_SECRET` is set
   - Check build logs for Prisma errors

2. **Google OAuth Errors**
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
   - Check that redirect URIs are correctly configured
   - Ensure the Google+ API is enabled

3. **Authentication Issues**
   - Verify `NEXTAUTH_URL` matches your production domain
   - Check that `AUTH_TRUST_HOST` is set if behind a proxy

### Debug Steps:

1. **Check Health Endpoint**

   ```
   GET /api/health
   ```

   This will show environment variable status and app health.

2. **Review Build Logs**
   - Look for any error messages during Prisma generation
   - Check for missing environment variables

3. **Test Locally First**
   ```bash
   cd apps/web
   npm run build
   npm start
   ```

## Environment Variable Examples

```bash
# Required
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-app.amplifyapp.com
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Optional
DATABASE_URL=postgresql://user:pass@host:port/db
AUTH_DISABLE_ADAPTER=true
NODE_ENV=production
```

## Support

If you're still experiencing issues:

1. Check the health endpoint for detailed error information
2. Review the build logs in Amplify console
3. Ensure all environment variables are properly set
4. Verify Google OAuth credentials are correctly configured
