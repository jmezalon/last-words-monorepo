aws_region   = "us-east-1"
environment  = "prod"

vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24"]

instance_type    = "t3.medium"
min_size         = 2
max_size         = 5
desired_capacity = 3

# domain_name     = "lastwords.com"
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
