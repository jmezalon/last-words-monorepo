# Security Headers & WAF Implementation

This directory contains comprehensive security configurations for the Last Words secure digital legacy application.

## 🔒 Security Headers Implementation

### Next.js Application (`next.config.js`)

- **Content Security Policy (CSP)**: Strict policy preventing XSS attacks
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS with 1-year max-age
- **Cross-Origin Policies**: COOP, COEP, CORP for isolation
- **Referrer Policy**: Strict origin control
- **Permissions Policy**: Disabled dangerous browser APIs
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing

### API Service (NestJS Middleware)

- **SecurityHeadersMiddleware**: Comprehensive header injection
- **CorsMiddleware**: Strict CORS policy with origin validation
- **Rate Limiting Headers**: Dynamic rate limit information
- **Cache Control**: No-cache for sensitive endpoints

## 🛡️ WAF Rules & Protection

### Cloudflare WAF Rules (`cloudflare-waf-rules.json`)

- **Bot Protection**: Blocks unverified bots and scrapers
- **Rate Limiting**: Tiered limits for different endpoint types
- **SQL Injection Protection**: Blocks common injection patterns
- **XSS Protection**: Prevents cross-site scripting
- **Path Traversal Protection**: Blocks directory traversal
- **Geographic Restrictions**: Optional country-based blocking
- **DDoS Protection**: Connection flood mitigation

### Endpoint-Specific Protection

- **Authentication**: 10 requests/minute, block on exceed
- **Crypto Operations**: 20 requests/minute, challenge on exceed
- **Shamir Shares**: 5 requests/5 minutes, block on exceed
- **Release Operations**: 3 requests/10 minutes, block on exceed

## 🏗️ Infrastructure as Code

### Terraform Configuration (`terraform/`)

- **Cloudflare Security Module**: Complete WAF rule deployment
- **Rate Limiting Rules**: Automated rule creation
- **Security Settings**: Zone-level security configuration
- **Bot Management**: Advanced bot detection and mitigation
- **SSL/TLS Configuration**: Strong cipher suites and protocols

### AWS WAF Rules (`aws-waf-rules.json`)

- **Managed Rule Sets**: AWS Common, SQLi, Known Bad Inputs
- **Custom Rate Limiting**: Application-specific limits
- **Geographic Blocking**: High-risk country restrictions
- **Request Size Limits**: Protection against large payloads

## 🐳 Container Security (`docker-security.yml`)

- **Security Options**: no-new-privileges, capability dropping
- **Read-Only Filesystems**: Immutable container runtime
- **User Isolation**: Non-root user execution
- **Network Segmentation**: Isolated frontend/backend networks
- **Health Checks**: Container health monitoring
- **Fail2Ban Integration**: Automated IP blocking

## 🔧 Nginx Security (`nginx-security.conf`)

- **Security Headers**: Complete header set
- **Rate Limiting Zones**: Multi-tier rate limiting
- **SSL/TLS Security**: Strong protocols and ciphers
- **Request Filtering**: Block malicious patterns
- **Connection Limits**: Per-IP connection restrictions

## 📊 Testing & Validation

### Security Test Suite (`security-test.js`)

```bash
# Test security headers
node infra/security/security-test.js

# Test specific endpoint
node -e "
const SecurityTester = require('./infra/security/security-test.js');
const tester = new SecurityTester('https://your-domain.com');
tester.testSecurityHeaders();
"
```

### Manual Testing Commands

```bash
# Test CSP headers
curl -I https://your-domain.com

# Test rate limiting
for i in {1..20}; do curl -X POST https://api.your-domain.com/api/auth/login; done

# Test WAF rules
curl -X POST https://your-domain.com/api/test -d "'; DROP TABLE users; --"
```

## 🚀 Deployment Instructions

### 1. Cloudflare Setup

```bash
# Deploy Terraform configuration
cd infra/terraform
terraform init
terraform plan -var="cloudflare_api_token=YOUR_TOKEN"
terraform apply
```

### 2. Next.js Deployment

Security headers are automatically applied via `next.config.js` configuration.

### 3. API Service Deployment

Security middleware is automatically loaded via NestJS module configuration.

### 4. Container Deployment

```bash
# Deploy with security configuration
docker-compose -f infra/security/docker-security.yml up -d
```

## 🔍 Monitoring & Alerts

### Cloudflare Analytics

- Monitor WAF rule triggers
- Track rate limiting events
- Analyze bot traffic patterns
- Review security event logs

### Custom Metrics

- API endpoint response times
- Rate limiting hit rates
- Security header compliance
- Failed authentication attempts

## ⚠️ Security Considerations

### Critical Endpoints Protection

- **Shamir Share Operations**: Ultra-strict rate limiting (5/5min)
- **Release Key Access**: Extreme protection (3/10min)
- **Authentication**: Moderate protection (10/min)
- **Crypto Operations**: Balanced protection (20/min)

### Zero-Knowledge Architecture

- All sensitive operations client-side only
- Server never sees unencrypted secrets
- Strong cryptographic implementations
- Comprehensive audit logging

### Production Checklist

- [ ] Update allowed origins in CORS middleware
- [ ] Configure real admin IP addresses
- [ ] Enable geographic restrictions if needed
- [ ] Set up monitoring and alerting
- [ ] Test all security headers
- [ ] Validate WAF rule effectiveness
- [ ] Configure SSL certificates
- [ ] Enable fail2ban integration

## 📚 References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Cloudflare WAF Documentation](https://developers.cloudflare.com/waf/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
