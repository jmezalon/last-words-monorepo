#!/bin/bash

# Security Pipeline Validation Script
# Tests the SAST/DAST pipeline configuration

set -e

echo "🔒 Validating Security Pipeline Configuration"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if required files exist
echo "Checking pipeline configuration files..."

FILES=(
    ".github/workflows/ci.yml"
    ".github/workflows/security-scan.yml"
    ".zap/rules.tsv"
    ".semgrepignore"
    "apps/web/src/pages/api/health.ts"
    "services/api/src/health/health.controller.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Found $file"
    else
        print_status 1 "Missing $file"
        exit 1
    fi
done

# Validate CI workflow syntax
echo -e "\nValidating GitHub Actions workflows..."

if command -v yq &> /dev/null; then
    yq eval '.jobs' .github/workflows/ci.yml > /dev/null 2>&1
    print_status $? "CI workflow syntax"
    
    yq eval '.jobs' .github/workflows/security-scan.yml > /dev/null 2>&1
    print_status $? "Security scan workflow syntax"
else
    print_warning "yq not installed - skipping YAML validation"
fi

# Check for required secrets documentation
echo -e "\nChecking security configuration..."

REQUIRED_SECRETS=(
    "SEMGREP_APP_TOKEN"
    "SNYK_TOKEN"
    "NVD_API_KEY"
)

echo "Required GitHub secrets:"
for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -q "$secret" .github/workflows/*.yml; then
        print_status 0 "Workflow references $secret"
    else
        print_status 1 "Missing reference to $secret"
    fi
done

# Validate ZAP rules format
echo -e "\nValidating ZAP rules configuration..."

if [ -f ".zap/rules.tsv" ]; then
    # Check if file has proper TSV format
    if grep -q $'\t' .zap/rules.tsv; then
        print_status 0 "ZAP rules file has tab-separated format"
    else
        print_status 1 "ZAP rules file missing tab separators"
    fi
    
    # Count rules
    RULE_COUNT=$(grep -v '^#' .zap/rules.tsv | grep -v '^$' | wc -l)
    echo "ZAP rules configured: $RULE_COUNT"
fi

# Validate Semgrep ignore patterns
echo -e "\nValidating Semgrep configuration..."

if [ -f ".semgrepignore" ]; then
    IGNORE_PATTERNS=$(grep -v '^#' .semgrepignore | grep -v '^$' | wc -l)
    echo "Semgrep ignore patterns: $IGNORE_PATTERNS"
    print_status 0 "Semgrep ignore file configured"
fi

# Test health endpoints exist
echo -e "\nValidating health endpoints..."

if [ -f "apps/web/src/pages/api/health.ts" ]; then
    if grep -q "status.*healthy" apps/web/src/pages/api/health.ts; then
        print_status 0 "Web health endpoint configured"
    else
        print_status 1 "Web health endpoint missing status response"
    fi
fi

if [ -f "services/api/src/health/health.controller.ts" ]; then
    if grep -q "@Controller.*health" services/api/src/health/health.controller.ts; then
        print_status 0 "API health controller configured"
    else
        print_status 1 "API health controller missing decorator"
    fi
fi

# Check package.json for security scripts
echo -e "\nChecking security scripts..."

if [ -f "package.json" ]; then
    if grep -q "audit" package.json; then
        print_status 0 "Audit script available"
    else
        print_warning "No audit script found in package.json"
    fi
fi

# Validate SARIF upload configuration
echo -e "\nValidating SARIF configuration..."

SARIF_UPLOADS=$(grep -r "upload-sarif" .github/workflows/ | wc -l)
echo "SARIF upload actions configured: $SARIF_UPLOADS"

if [ $SARIF_UPLOADS -gt 0 ]; then
    print_status 0 "SARIF uploads configured"
else
    print_status 1 "No SARIF uploads found"
fi

# Check for security job dependencies
echo -e "\nValidating job dependencies..."

if grep -q "needs:.*sast-scan" .github/workflows/ci.yml; then
    print_status 0 "Security jobs have proper dependencies"
else
    print_warning "Security jobs may not have proper dependencies"
fi

# Summary
echo -e "\n🔒 Security Pipeline Validation Complete"
echo "========================================"

# Test local security tools if available
echo -e "\nTesting local security tools..."

if command -v semgrep &> /dev/null; then
    echo "Testing Semgrep..."
    semgrep --config=auto --dry-run . > /dev/null 2>&1
    print_status $? "Semgrep dry run"
else
    print_warning "Semgrep not installed locally"
fi

if command -v snyk &> /dev/null; then
    echo "Testing Snyk..."
    snyk test --dry-run > /dev/null 2>&1 || true
    print_status 0 "Snyk available"
else
    print_warning "Snyk not installed locally"
fi

echo -e "\n✅ Security pipeline validation completed successfully!"
echo "Make sure to configure the required secrets in GitHub repository settings:"
for secret in "${REQUIRED_SECRETS[@]}"; do
    echo "  - $secret"
done
