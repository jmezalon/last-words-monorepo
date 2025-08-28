#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Environment Variables Generator');
console.log('=====================================\n');

// Generate a secure random secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

console.log('Required Environment Variables:');
console.log('==============================\n');

console.log(`NEXTAUTH_SECRET=${generateSecret()}`);
console.log(`NEXTAUTH_URL=https://your-app.amplifyapp.com`);
console.log(`NODE_ENV=production`);

console.log('\nGoogle OAuth Credentials (Required):');
console.log('====================================\n');

console.log('# You need to set up Google OAuth credentials:');
console.log('# 1. Go to https://console.cloud.google.com/');
console.log('# 2. Create a new project or select existing one');
console.log('# 3. Enable Google+ API');
console.log(
  '# 4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID'
);
console.log('# 5. Set Application Type to "Web application"');
console.log('# 6. Add authorized redirect URIs:');
console.log('#    - https://your-app.amplifyapp.com/api/auth/callback/google');
console.log(
  '#    - http://localhost:3000/api/auth/callback/google (for local dev)'
);
console.log('# 7. Copy the Client ID and Client Secret');

console.log('\n# Then set these environment variables:');
console.log('# GOOGLE_CLIENT_ID=your-google-client-id-here');
console.log('# GOOGLE_CLIENT_SECRET=your-google-client-secret-here');

console.log('\nOptional Environment Variables:');
console.log('===============================\n');

console.log('# Uncomment and set these if needed:');
console.log('# DATABASE_URL=postgresql://user:pass@host:port/db');
console.log('# AUTH_DISABLE_ADAPTER=true');
console.log('# AUTH_TRUST_HOST=true');

console.log('\n📝 Instructions:');
console.log('1. Copy the NEXTAUTH_SECRET value above');
console.log('2. Set up Google OAuth credentials (see instructions above)');
console.log('3. Set all environment variables in AWS Amplify console');
console.log('4. Update NEXTAUTH_URL to match your actual domain');
console.log('5. Deploy your application');

console.log('\n🔍 Debug:');
console.log('- Check /api/health endpoint after deployment');
console.log('- Review build logs in Amplify console');
console.log('- Ensure all environment variables are set correctly');
console.log('- Test Google sign-in flow');
