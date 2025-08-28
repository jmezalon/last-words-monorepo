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

console.log('\nOptional Environment Variables:');
console.log('===============================\n');

console.log('# Uncomment and set these if needed:');
console.log('# DATABASE_URL=postgresql://user:pass@host:port/db');
console.log('# AUTH_DISABLE_ADAPTER=true');
console.log('# AUTH_TRUST_HOST=true');

console.log('\n📝 Instructions:');
console.log('1. Copy the NEXTAUTH_SECRET value above');
console.log('2. Set it in your AWS Amplify environment variables');
console.log('3. Update NEXTAUTH_URL to match your actual domain');
console.log('4. Deploy your application');

console.log('\n🔍 Debug:');
console.log('- Check /api/health endpoint after deployment');
console.log('- Review build logs in Amplify console');
console.log('- Ensure all environment variables are set correctly');
