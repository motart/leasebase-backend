variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.10.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-1a", "us-west-1b"]
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "leasebase"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "Full database connection URL (set after RDS is created)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_container_image" {
  description = "Container image for API (leave empty to use ECR)"
  type        = string
  default     = ""
}

variable "web_bucket_suffix" {
  description = "Unique suffix for web S3 bucket"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo"
  type        = string
  default     = "motart/leasebase-backend"
}
