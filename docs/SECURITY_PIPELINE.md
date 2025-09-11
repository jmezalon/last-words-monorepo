# SAST/DAST Security Pipeline Documentation

This document describes the comprehensive security scanning pipeline implemented for the Last Words secure digital legacy application.

## 🔒 Pipeline Overview

The security pipeline implements multiple layers of security scanning:

- **SAST (Static Application Security Testing)**: Code analysis without execution
- **DAST (Dynamic Application Security Testing)**: Runtime security testing
- **Dependency Scanning**: Third-party vulnerability detection
- **SARIF Reporting**: Standardized security findings format

## 🛠️ Tools & Technologies

### SAST Tools
- **Semgrep**: Multi-language static analysis with comprehensive rulesets
- **CodeQL**: GitHub's semantic code analysis engine
- **ESLint Security Plugin**: JavaScript/TypeScript security linting

### Dependency Scanners
- **Snyk**: Vulnerability database and dependency scanning
- **npm audit**: Built-in Node.js vulnerability scanner
- **cargo-audit**: Rust dependency security auditing
- **OWASP Dependency Check**: Multi-language dependency scanner

### DAST Tools
- **OWASP ZAP**: Web application security scanner
- **Nuclei**: Fast vulnerability scanner with community templates

## 📋 Pipeline Configuration

### CI Pipeline (`ci.yml`)

```yaml
jobs:
  sast-scan:           # Static analysis
  dependency-scan:     # Dependency vulnerabilities
  dast-scan:          # Dynamic testing (main branch only)
  security-summary:   # Consolidated results
```

### Comprehensive Security Scan (`security-scan.yml`)

```yaml
triggers:
  - Daily at 2 AM UTC
  - Manual dispatch with scan type selection
  - Configurable target URL for DAST

jobs:
  sast-comprehensive:      # Extended SAST with CodeQL
  dependency-comprehensive: # Multi-tool dependency scanning
  dast-comprehensive:      # Full DAST with multiple tools
  security-report:         # Detailed security reporting
```

## 🎯 Security Rulesets

### Semgrep Rulesets
- `p/security-audit` - General security patterns
- `p/secrets` - Hardcoded secrets detection
- `p/owasp-top-ten` - OWASP Top 10 vulnerabilities
- `p/javascript`, `p/typescript` - Language-specific rules
- `p/nodejs`, `p/react`, `p/nextjs` - Framework-specific rules
- `p/rust` - Rust security patterns
- `p/docker`, `p/terraform` - Infrastructure security
- `p/jwt`, `p/crypto` - Cryptography and authentication
- `p/sql-injection`, `p/xss` - Injection attack patterns
- `p/command-injection`, `p/path-traversal` - System security
- `p/csrf`, `p/ssrf` - Web security patterns

### ZAP Scanning Rules
- High-priority rules for authentication and session management
- Injection vulnerability detection (SQL, XSS, Command)
- Path traversal and file inclusion checks
- CSRF protection validation
- Content Security Policy analysis
- Custom rules for Last Words endpoints

## 🚨 Failure Conditions

The pipeline fails the build on:

### SAST Failures
- High-severity security findings from Semgrep
- Critical CodeQL security alerts
- Security-related ESLint errors

### Dependency Failures
- High or critical severity vulnerabilities in dependencies
- Known security advisories in Rust crates
- Outdated packages with security implications

### DAST Failures
- High-risk findings from OWASP ZAP
- Critical vulnerabilities detected by Nuclei
- Security misconfigurations in running application

## 📊 SARIF Reporting

All security tools generate SARIF (Static Analysis Results Interchange Format) reports:

### Upload Categories
- `semgrep` - Semgrep SAST findings
- `semgrep-comprehensive` - Extended Semgrep analysis
- `codeql-security` - CodeQL security analysis
- `snyk` - Snyk dependency vulnerabilities
- `snyk-rust` - Rust-specific Snyk findings
- `owasp-dependency-check` - OWASP dependency analysis
- `cargo-audit` - Rust security audit
- `zap-dast` - OWASP ZAP dynamic findings
- `nuclei-dast` - Nuclei vulnerability scan

### GitHub Security Tab Integration
All SARIF reports are automatically uploaded to GitHub's Security tab, providing:
- Centralized security findings dashboard
- Historical trend analysis
- Integration with pull request reviews
- Alert management and dismissal

## 🔧 Configuration Files

### `.semgrepignore`
Excludes build artifacts and reduces false positives while maintaining security coverage:
```
node_modules/
dist/
build/
target/
.next/
```

### `.zap/rules.tsv`
ZAP scanning rules with severity thresholds:
```
# High-priority security rules
40018	HIGH	# SQL Injection
40012	HIGH	# Cross Site Scripting (Reflected)
90020	HIGH	# Remote OS Command Injection
```

### Health Endpoints
- `/health` (Web) - Application health status
- `/api/health` (Web API) - API health endpoint
- `/health` (API Service) - Backend service health

## 🚀 Deployment Integration

### Pre-deployment Security Gates
1. All SAST scans must pass
2. No high/critical dependency vulnerabilities
3. DAST scan results within acceptable thresholds
4. SARIF reports successfully uploaded

### Staging Environment Testing
- DAST scans run against staging deployments
- Configurable target URLs for different environments
- Comprehensive security validation before production

## 📈 Monitoring & Alerting

### Security Metrics
- Number of security findings by severity
- Time to remediation for security issues
- Dependency vulnerability trends
- False positive rates by tool

### Alert Channels
- GitHub Security Advisories
- Pull request status checks
- Security team notifications
- Automated issue creation for high-severity findings

## 🔍 Local Development

### Running Security Scans Locally

```bash
# Validate pipeline configuration
.github/scripts/validate-security.sh

# Run Semgrep locally (if installed)
semgrep --config=auto .

# Run dependency audit
npm audit --audit-level high
pnpm audit --audit-level high

# Rust security audit
cd services/crypto
cargo audit
```

### IDE Integration
- ESLint security rules in development
- Pre-commit hooks for basic security checks
- Real-time security feedback during development

## 🛡️ Security Best Practices

### Code Security
- Input validation and sanitization
- Secure cryptographic implementations
- Proper error handling without information disclosure
- Authentication and authorization controls

### Dependency Management
- Regular dependency updates
- Security-focused dependency selection
- Minimal dependency footprint
- License compliance verification

### Infrastructure Security
- Container security hardening
- Network segmentation
- Secrets management
- Access control and monitoring

## 📚 Required Secrets

Configure these secrets in GitHub repository settings:

- `SEMGREP_APP_TOKEN` - Semgrep Cloud integration
- `SNYK_TOKEN` - Snyk vulnerability database access
- `NVD_API_KEY` - NIST National Vulnerability Database access

## 🔄 Maintenance

### Regular Tasks
- Update security tool versions
- Review and tune security rules
- Analyze false positive patterns
- Update ignore patterns as needed
- Monitor new vulnerability disclosures

### Rule Tuning
- Review security findings for accuracy
- Adjust severity thresholds based on risk assessment
- Add custom rules for application-specific patterns
- Maintain allowlists for legitimate security patterns

## 📞 Support & Troubleshooting

### Common Issues
- **High false positive rate**: Tune `.semgrepignore` and ZAP rules
- **Pipeline timeouts**: Optimize scan scope and parallelization
- **SARIF upload failures**: Check file format and GitHub permissions
- **DAST scan failures**: Verify application startup and health endpoints

### Performance Optimization
- Parallel scan execution
- Incremental analysis for large codebases
- Caching of security tool databases
- Optimized Docker image layers

This security pipeline provides comprehensive protection while maintaining development velocity and minimizing false positives.
