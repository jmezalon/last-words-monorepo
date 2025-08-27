aws_region   = "us-east-1"
environment  = "dev"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

instance_type    = "t3.micro"
min_size         = 1
max_size         = 2
desired_capacity = 1

# domain_name     = "dev.lastwords.com"
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
