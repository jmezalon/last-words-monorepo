# Infrastructure

This directory contains the Terraform infrastructure code for the Last Words application.

## Structure

```
infra/
├── terraform/
│   ├── main.tf              # Main Terraform configuration
│   ├── variables.tf         # Variable definitions
│   ├── outputs.tf           # Output definitions
│   ├── modules/             # Terraform modules
│   │   ├── vpc/             # VPC module
│   │   ├── compute/         # Compute resources (ALB, EC2, etc.)
│   │   ├── database/        # Database resources (RDS)
│   │   └── storage/         # Storage resources (S3, CloudFront, ElastiCache)
│   └── environments/        # Environment-specific variable files
│       ├── dev.tfvars
│       ├── staging.tfvars
│       └── prod.tfvars
```

## Usage

1. Initialize Terraform:
   ```bash
   cd infra/terraform
   terraform init
   ```

2. Plan deployment for specific environment:
   ```bash
   terraform plan -var-file=environments/dev.tfvars
   ```

3. Apply changes:
   ```bash
   terraform apply -var-file=environments/dev.tfvars
   ```

## Resources Created

- **VPC**: Virtual Private Cloud with public and private subnets
- **ALB**: Application Load Balancer for web traffic distribution
- **RDS**: PostgreSQL database instance
- **ElastiCache**: Redis cluster for caching
- **S3**: Bucket for static assets
- **CloudFront**: CDN for global content delivery
- **Security Groups**: Network security configurations

## Environment Configuration

Each environment (dev, staging, prod) has its own variable file with appropriate sizing and configuration for that environment.

## Security

- All resources are deployed in private subnets where possible
- Security groups restrict access between components
- Database passwords are stored in AWS Secrets Manager
- S3 buckets have public access blocked
- CloudFront provides HTTPS termination
