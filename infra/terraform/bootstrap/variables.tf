variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be 'dev' or 'prod'."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-1a", "us-west-1b"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets (recommended for production)"
  type        = bool
  default     = false
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo"
  type        = string
  default     = "motart/leasebase-backend"
}
