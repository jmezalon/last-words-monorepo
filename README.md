# Last Words - Monorepo

A modern, full-stack monorepo built with TypeScript, Next.js, NestJS, and Rust.

## 🏗️ Architecture

This monorepo contains:

- **`apps/web`** - Next.js 14 frontend with TypeScript and App Router
- **`services/api`** - NestJS backend API service
- **`services/crypto`** - Rust-based cryptographic service
- **`infra/`** - Terraform infrastructure as code

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust (for crypto service)
- Docker (optional)

### Installation

```bash
# Install dependencies
pnpm install

# Setup git hooks
pnpm prepare
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Start specific service
pnpm --filter @last-words/web dev
pnpm --filter @last-words/api dev
pnpm --filter @last-words/crypto dev
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @last-words/web build
```

## 📦 Package Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all TypeScript packages
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean build artifacts

## 🛠️ Tech Stack

### Frontend (`apps/web`)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting with security rules
- **Prettier** - Code formatting

### Backend (`services/api`)
- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **Express** - HTTP server
- **Jest** - Testing framework

### Crypto Service (`services/crypto`)
- **Rust** - Systems programming language
- **Tokio** - Async runtime
- **AES-GCM** - Encryption
- **SHA-256** - Hashing

### Infrastructure (`infra/`)
- **Terraform** - Infrastructure as Code
- **AWS** - Cloud provider
- **VPC, ALB, RDS, ElastiCache, S3, CloudFront** - AWS services

## 🔧 Development Tools

- **Turbo** - Build system and task runner
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Linting with security rules
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files
- **commitlint** - Conventional commit messages

## 🔒 Security

- **ESLint Security Plugin** - Security-focused linting rules
- **Semgrep SAST** - Static application security testing
- **Dependency Auditing** - Automated vulnerability scanning
- **Conventional Commits** - Standardized commit messages

## 🚀 CI/CD

GitHub Actions workflow includes:

- **Linting** - Code quality checks
- **Type Checking** - TypeScript validation
- **Testing** - Automated test execution
- **Building** - Multi-language build process
- **Security Scanning** - SAST with Semgrep
- **Dependency Auditing** - Vulnerability detection

## 📁 Project Structure

```
last-words/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   └── app/         # App Router pages
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── services/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   ├── package.json
│   │   ├── nest-cli.json
│   │   └── tsconfig.json
│   └── crypto/              # Rust crypto service
│       ├── src/
│       ├── Cargo.toml
│       └── package.json
├── infra/
│   └── terraform/           # Infrastructure code
│       ├── modules/
│       ├── environments/
│       └── *.tf
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
├── .husky/                  # Git hooks
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # pnpm workspace config
├── turbo.json              # Turbo configuration
├── .eslintrc.js            # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .commitlintrc.js        # Commitlint configuration
└── README.md
```

## 🌍 Infrastructure

The infrastructure is defined using Terraform and includes:

- **VPC** with public/private subnets
- **Application Load Balancer** for traffic distribution
- **RDS PostgreSQL** for database
- **ElastiCache Redis** for caching
- **S3** for static assets
- **CloudFront** for CDN
- **Security Groups** for network security

### Deploy Infrastructure

```bash
cd infra/terraform
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

## 🤝 Contributing

1. Follow conventional commit messages
2. Run `pnpm lint` and `pnpm type-check` before committing
3. Ensure all tests pass with `pnpm test`
4. Use `pnpm format` to format code

## 📄 License

This project is licensed under the MIT License.
