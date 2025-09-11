# Cloudflare Security Module - Terraform IaC
# Implements WAF rules, rate limiting, and security policies

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain" {
  description = "Domain name"
  type        = string
}

variable "api_subdomain" {
  description = "API subdomain"
  type        = string
  default     = "api"
}

# WAF Custom Rules
resource "cloudflare_ruleset" "waf_custom_rules" {
  zone_id     = var.zone_id
  name        = "Last Words WAF Custom Rules"
  description = "Custom WAF rules for secure digital legacy application"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # Bot Throttling Rule
  rule {
    action = "block"
    expression = "(cf.bot_management.score lt 30) or (http.user_agent contains \"bot\" and not cf.bot_management.verified_bot)"
    description = "Block aggressive bots and unverified crawlers"
    enabled = true
  }

  # SQL Injection Protection
  rule {
    action = "block"
    expression = "(http.request.uri.query contains \"union select\") or (http.request.uri.query contains \"drop table\") or (http.request.body.raw contains \"union select\")"
    description = "Block SQL injection attempts"
    enabled = true
  }

  # XSS Protection
  rule {
    action = "block"
    expression = "(http.request.uri.query contains \"<script\") or (http.request.body.raw contains \"<script\")"
    description = "Block XSS attempts"
    enabled = true
  }

  # Path Traversal Protection
  rule {
    action = "block"
    expression = "(http.request.uri.path contains \"../\") or (http.request.uri.path contains \"..\\\\\")"
    description = "Block directory traversal attempts"
    enabled = true
  }

  # Admin Path Protection
  rule {
    action = "block"
    expression = "http.request.uri.path matches \"^/(admin|wp-admin|phpmyadmin|administrator).*\""
    description = "Block access to common admin paths"
    enabled = true
  }

  # Large Request Body Protection
  rule {
    action = "block"
    expression = "http.request.body.size gt 10485760"
    description = "Block requests with bodies larger than 10MB"
    enabled = true
  }

  # Suspicious User Agents
  rule {
    action = "block"
    expression = "(http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nmap\") or (http.user_agent contains \"nikto\") or (http.user_agent eq \"\")"
    description = "Block known malicious user agents"
    enabled = true
  }
}

# Rate Limiting Rules
resource "cloudflare_rate_limit" "api_general" {
  zone_id   = var.zone_id
  threshold = 100
  period    = 60
  match {
    request {
      url_pattern = "${var.api_subdomain}.${var.domain}/api/*"
      schemes     = ["HTTPS"]
      methods     = ["GET", "POST", "PUT", "DELETE"]
    }
  }
  action {
    mode    = "challenge"
    timeout = 300
  }
  correlate {
    by = "ip"
  }
  disabled = false
  description = "General API rate limiting - 100 requests per minute"
}

resource "cloudflare_rate_limit" "auth_endpoints" {
  zone_id   = var.zone_id
  threshold = 10
  period    = 60
  match {
    request {
      url_pattern = "${var.api_subdomain}.${var.domain}/api/auth/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  action {
    mode    = "block"
    timeout = 3600
  }
  correlate {
    by = "ip"
  }
  disabled = false
  description = "Auth endpoint protection - 10 attempts per minute"
}

resource "cloudflare_rate_limit" "crypto_endpoints" {
  zone_id   = var.zone_id
  threshold = 20
  period    = 60
  match {
    request {
      url_pattern = "${var.api_subdomain}.${var.domain}/api/crypto/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  action {
    mode    = "challenge"
    timeout = 600
  }
  correlate {
    by = "ip"
  }
  disabled = false
  description = "Crypto endpoint protection - 20 requests per minute"
}

resource "cloudflare_rate_limit" "shamir_endpoints" {
  zone_id   = var.zone_id
  threshold = 5
  period    = 300
  match {
    request {
      url_pattern = "${var.api_subdomain}.${var.domain}/api/shamir/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  action {
    mode    = "block"
    timeout = 1800
  }
  correlate {
    by = "ip"
  }
  disabled = false
  description = "Shamir endpoint protection - 5 attempts per 5 minutes"
}

resource "cloudflare_rate_limit" "release_endpoints" {
  zone_id   = var.zone_id
  threshold = 3
  period    = 600
  match {
    request {
      url_pattern = "${var.api_subdomain}.${var.domain}/api/release/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  action {
    mode    = "block"
    timeout = 3600
  }
  correlate {
    by = "ip"
  }
  disabled = false
  description = "Release endpoint protection - 3 attempts per 10 minutes"
}

# Security Level Settings
resource "cloudflare_zone_settings_override" "security_settings" {
  zone_id = var.zone_id
  settings {
    security_level = "high"
    challenge_ttl  = 1800
    browser_check  = "on"
    hotlink_protection = "on"
    ip_geolocation = "on"
    server_side_exclude = "on"
    ssl = "strict"
    always_use_https = "on"
    automatic_https_rewrites = "on"
    tls_1_3 = "on"
    min_tls_version = "1.2"
    opportunistic_encryption = "on"
    privacy_pass = "on"
    security_header {
      enabled = true
      max_age = 31536000
      include_subdomains = true
      preload = true
    }
  }
}

# Bot Management
resource "cloudflare_bot_management" "bot_protection" {
  zone_id                = var.zone_id
  enable_js              = true
  fight_mode             = true
  using_latest_model     = true
  optimize_wordpress     = false
  sbfm_definitely_automated = "block"
  sbfm_likely_automated     = "challenge"
  sbfm_verified_bots        = "allow"
  sbfm_static_resource_protection = false
}

# Page Rules for Enhanced Security
resource "cloudflare_page_rule" "api_security" {
  zone_id  = var.zone_id
  target   = "${var.api_subdomain}.${var.domain}/api/*"
  priority = 1
  status   = "active"

  actions {
    security_level = "high"
    cache_level    = "bypass"
    browser_check  = "on"
  }
}

resource "cloudflare_page_rule" "admin_block" {
  zone_id  = var.zone_id
  target   = "${var.domain}/admin*"
  priority = 2
  status   = "active"

  actions {
    forwarding_url {
      url         = "https://${var.domain}/404"
      status_code = 404
    }
  }
}

# Access Rules for Known Bad IPs
resource "cloudflare_access_rule" "block_tor_exit_nodes" {
  zone_id = var.zone_id
  mode    = "challenge"
  configuration {
    target = "country"
    value  = "T1"  # Tor exit nodes
  }
  notes = "Challenge Tor exit node traffic"
}

# DDoS Protection
resource "cloudflare_zone_settings_override" "ddos_protection" {
  zone_id = var.zone_id
  settings {
    challenge_ttl = 1800
    security_level = "high"
  }
}

# Output important values
output "waf_ruleset_id" {
  description = "WAF Custom Ruleset ID"
  value       = cloudflare_ruleset.waf_custom_rules.id
}

output "rate_limit_ids" {
  description = "Rate Limit Rule IDs"
  value = {
    api_general      = cloudflare_rate_limit.api_general.id
    auth_endpoints   = cloudflare_rate_limit.auth_endpoints.id
    crypto_endpoints = cloudflare_rate_limit.crypto_endpoints.id
    shamir_endpoints = cloudflare_rate_limit.shamir_endpoints.id
    release_endpoints = cloudflare_rate_limit.release_endpoints.id
  }
}
