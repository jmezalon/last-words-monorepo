# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Name your project (e.g., "Last Words App")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity API"
3. Click on it and click "Enable"

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "Last Words"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the steps

4. Back to creating OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "Last Words Web Client"
   - Authorized redirect URIs:
     - `https://main.d3ste5u3f3aspp.amplifyapp.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local development)
   - Click "Create"

5. **Copy the Client ID and Client Secret** (you'll need these for environment variables)

## Step 4: Set Environment Variables in AWS Amplify

1. Go to your AWS Amplify console
2. Navigate to your app > Environment variables
3. Add these variables:

```
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://main.d3ste5u3f3aspp.amplifyapp.com
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
NODE_ENV=production
```

## Step 5: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
cd apps/web
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Redeploy

After setting the environment variables, trigger a new deployment by pushing a small change to your repository.

## Troubleshooting

### Common Issues:

1. **"Error: undefined"**
   - Usually means Google OAuth credentials are missing
   - Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set

2. **"Invalid redirect URI"**
   - Make sure the redirect URI in Google Console matches your Amplify domain exactly
   - Include the full path: `/api/auth/callback/google`

3. **"Configuration error"**
   - Verify all environment variables are set correctly
   - Check that NEXTAUTH_URL matches your domain

### Testing:

1. Visit your app: `https://main.d3ste5u3f3aspp.amplifyapp.com`
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you should be redirected back to your app

### Debug:

Check the health endpoint: `https://main.d3ste5u3f3aspp.amplifyapp.com/api/health`
This will show if your environment variables are properly configured.
