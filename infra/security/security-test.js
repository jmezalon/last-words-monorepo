/**
 * Security Headers Test Script
 * Tests the implementation of security headers and WAF rules
 */

const https = require('https');
const http = require('http');

class SecurityTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testSecurityHeaders() {
    console.log('🔒 Testing Security Headers Implementation...\n');

    const tests = [
      {
        name: 'Content Security Policy',
        header: 'content-security-policy',
        expected: /default-src 'self'/,
      },
      {
        name: 'Strict Transport Security',
        header: 'strict-transport-security',
        expected: /max-age=31536000/,
      },
      {
        name: 'X-Frame-Options',
        header: 'x-frame-options',
        expected: /DENY/,
      },
      {
        name: 'X-Content-Type-Options',
        header: 'x-content-type-options',
        expected: /nosniff/,
      },
      {
        name: 'Cross-Origin-Embedder-Policy',
        header: 'cross-origin-embedder-policy',
        expected: /credentialless|require-corp/,
      },
      {
        name: 'Cross-Origin-Opener-Policy',
        header: 'cross-origin-opener-policy',
        expected: /same-origin/,
      },
      {
        name: 'Referrer-Policy',
        header: 'referrer-policy',
        expected: /strict-origin-when-cross-origin/,
      },
      {
        name: 'Permissions-Policy',
        header: 'permissions-policy',
        expected: /camera=\(\)/,
      },
    ];

    for (const test of tests) {
      await this.testHeader(test);
    }

    this.printResults();
  }

  async testHeader(test) {
    return new Promise(resolve => {
      const options = {
        hostname: this.baseUrl.replace(/https?:\/\//, ''),
        port: this.baseUrl.includes('https') ? 443 : 80,
        path: '/',
        method: 'GET',
        timeout: 5000,
      };

      const client = this.baseUrl.includes('https') ? https : http;

      const req = client.request(options, res => {
        const headerValue = res.headers[test.header];
        const passed = headerValue && test.expected.test(headerValue);

        this.results.push({
          name: test.name,
          passed,
          expected: test.expected.toString(),
          actual: headerValue || 'Not present',
        });

        resolve();
      });

      req.on('error', err => {
        this.results.push({
          name: test.name,
          passed: false,
          expected: test.expected.toString(),
          actual: `Error: ${err.message}`,
        });
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        this.results.push({
          name: test.name,
          passed: false,
          expected: test.expected.toString(),
          actual: 'Timeout',
        });
        resolve();
      });

      req.end();
    });
  }

  async testRateLimiting() {
    console.log('\n🚦 Testing Rate Limiting...\n');

    const endpoints = [
      '/api/auth/login',
      '/api/crypto/generate-key',
      '/api/shamir/distribute',
      '/api/release/access',
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointRateLimit(endpoint);
    }
  }

  async testEndpointRateLimit(endpoint) {
    console.log(`Testing rate limit for ${endpoint}...`);

    const requests = [];
    const maxRequests = 20;

    for (let i = 0; i < maxRequests; i++) {
      requests.push(this.makeRequest(endpoint));
    }

    try {
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);

      console.log(
        `  ${rateLimited ? '✅' : '❌'} Rate limiting ${rateLimited ? 'active' : 'not detected'}`
      );
    } catch (error) {
      console.log(`  ❌ Error testing rate limit: ${error.message}`);
    }
  }

  async makeRequest(path) {
    return new Promise(resolve => {
      const options = {
        hostname: this.baseUrl.replace(/https?:\/\//, ''),
        port: this.baseUrl.includes('https') ? 443 : 80,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 2000,
      };

      const client = this.baseUrl.includes('https') ? https : http;

      const req = client.request(options, res => {
        resolve({ status: res.statusCode });
      });

      req.on('error', () => {
        resolve({ status: 0 });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0 });
      });

      req.write('{}');
      req.end();
    });
  }

  printResults() {
    console.log('\n📊 Security Headers Test Results:\n');

    let passed = 0;
    let total = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);

      if (!result.passed) {
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual: ${result.actual}`);
      }

      if (result.passed) passed++;
    });

    console.log(
      `\n📈 Score: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`
    );

    if (passed === total) {
      console.log('🎉 All security headers are properly configured!');
    } else {
      console.log('⚠️  Some security headers need attention.');
    }
  }
}

// Usage examples
async function runTests() {
  const tester = new SecurityTester('http://localhost:3000');

  console.log('🔐 Last Words Security Test Suite\n');
  console.log('='.repeat(50));

  await tester.testSecurityHeaders();
  await tester.testRateLimiting();

  console.log('\n' + '='.repeat(50));
  console.log('✨ Security testing complete!');
}

// Export for use in other scripts
module.exports = SecurityTester;

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}
