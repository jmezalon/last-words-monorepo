#!/usr/bin/env node

const crypto = require('crypto');

console.log('🚀 Production Environment Setup');
console.log('================================\n');

// Generate a secure random secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

console.log('Required Environment Variables for AWS Amplify:');
console.log('===============================================\n');

console.log(`NEXTAUTH_SECRET=${generateSecret()}`);
console.log(`NEXTAUTH_URL=https://main.d3ste5u3f3aspp.amplifyapp.com`);
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
console.log(
  '#    - https://main.d3ste5u3f3aspp.amplifyapp.com/api/auth/callback/google'
);
console.log(
  '#    - http://localhost:3000/api/auth/callback/google (for local dev)'
);
console.log('# 7. Copy the Client ID and Client Secret');

console.log('\n# Then set these environment variables:');
console.log('# GOOGLE_CLIENT_ID=your-google-client-id-here');
console.log('# GOOGLE_CLIENT_SECRET=your-google-client-secret-here');

console.log('\n📝 Instructions:');
console.log('1. Copy the NEXTAUTH_SECRET value above');
console.log('2. Set up Google OAuth credentials (see instructions above)');
console.log('3. Go to AWS Amplify Console > Your App > Environment Variables');
console.log('4. Add all the environment variables listed above');
console.log('5. Make sure NEXTAUTH_URL is set to your production domain');
console.log('6. Redeploy your application');

console.log('\n🔍 Debug:');
console.log(
  '- Check the health endpoint: https://main.d3ste5u3f3aspp.amplifyapp.com/api/health'
);
console.log(
  '- This will show if your environment variables are properly configured'
);
console.log(
  '- Look for any issues or recommendations in the health check response'
);

console.log('\n⚠️  Important Notes:');
console.log('- NEXTAUTH_URL must be your production domain, not localhost');
console.log(
  '- Google OAuth redirect URIs must match your production domain exactly'
);
console.log('- Environment variables are case-sensitive');
console.log(
  '- After setting variables, you may need to trigger a new deployment'
);
