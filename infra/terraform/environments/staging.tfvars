aws_region   = "us-east-1"
environment  = "staging"

vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]

instance_type    = "t3.small"
min_size         = 1
max_size         = 3
desired_capacity = 2

# domain_name     = "staging.lastwords.com"
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
