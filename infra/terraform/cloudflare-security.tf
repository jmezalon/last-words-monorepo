# Main Cloudflare Security Configuration
# This file orchestrates the security module deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "lastwords.app"
}

variable "api_subdomain" {
  description = "API subdomain"
  type        = string
  default     = "api"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Provider Configuration
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Security Module
module "cloudflare_security" {
  source = "./modules/cloudflare-security"
  
  zone_id       = var.cloudflare_zone_id
  domain        = var.domain_name
  api_subdomain = var.api_subdomain
}

# Additional Security Configurations
resource "cloudflare_zone_lockdown" "admin_lockdown" {
  zone_id     = var.cloudflare_zone_id
  paused      = false
  description = "Lock down admin areas to specific IPs"
  
  urls = [
    "${var.domain_name}/admin*",
    "${var.api_subdomain}.${var.domain_name}/admin*"
  ]
  
  configurations {
    target = "ip"
    value  = "127.0.0.1"  # Replace with your admin IP addresses
  }
}

# Firewall Rules for Enhanced Protection
resource "cloudflare_filter" "block_countries" {
  zone_id     = var.cloudflare_zone_id
  description = "Block high-risk countries"
  expression  = "(ip.geoip.country in {\"CN\" \"RU\" \"KP\" \"IR\"})"
  paused      = true  # Enable based on your requirements
}

resource "cloudflare_firewall_rule" "block_countries_rule" {
  zone_id     = var.cloudflare_zone_id
  description = "Block traffic from high-risk countries"
  filter_id   = cloudflare_filter.block_countries.id
  action      = "challenge"
  paused      = true  # Enable based on your requirements
}

# Custom Certificate for Enhanced Security
resource "cloudflare_origin_ca_certificate" "api_cert" {
  csr                = file("${path.module}/certs/api.csr")  # You'll need to generate this
  hostnames          = ["${var.api_subdomain}.${var.domain_name}"]
  request_type       = "origin-rsa"
  requested_validity = 365
}

# Outputs
output "security_module_outputs" {
  description = "Security module outputs"
  value       = module.cloudflare_security
}

output "zone_security_settings" {
  description = "Zone security configuration"
  value = {
    zone_id    = var.cloudflare_zone_id
    domain     = var.domain_name
    environment = var.environment
  }
}
