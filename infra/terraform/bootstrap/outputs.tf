################################################################################
# Terraform State Backend
################################################################################

output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_locks_table" {
  description = "DynamoDB table for Terraform locks"
  value       = aws_dynamodb_table.terraform_locks.name
}

################################################################################
# VPC
################################################################################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

################################################################################
# Subnets
################################################################################

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "public_subnet_ids_csv" {
  description = "Public subnet IDs as comma-separated string (for GitHub secrets)"
  value       = join(",", aws_subnet.public[*].id)
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "private_subnet_ids_csv" {
  description = "Private subnet IDs as comma-separated string (for GitHub secrets)"
  value       = join(",", aws_subnet.private[*].id)
}

################################################################################
# Security Groups
################################################################################

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

################################################################################
# ECR
################################################################################

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.api.arn
}

################################################################################
# IAM Roles
################################################################################

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (use this in GitHub secrets)"
  value       = aws_iam_role.github_actions.arn
}

output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

################################################################################
# RDS
################################################################################

output "db_subnet_group_name" {
  description = "RDS DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

################################################################################
# CloudWatch
################################################################################

output "ecs_log_group_name" {
  description = "CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

################################################################################
# GitHub Secrets Summary
################################################################################

output "github_secrets_summary" {
  description = "Values to configure in GitHub secrets"
  value = <<-EOT
    
    ============================================================
    GitHub Secrets for ${upper(var.environment)} Environment
    ============================================================
    
    AWS_${upper(var.environment)}_ROLE_ARN = ${aws_iam_role.github_actions.arn}
    AWS_${upper(var.environment)}_SUBNETS = ${join(",", var.environment == "prod" ? aws_subnet.private[*].id : aws_subnet.public[*].id)}
    AWS_${upper(var.environment)}_SECURITY_GROUP = ${aws_security_group.ecs.id}
    
    ============================================================
  EOT
}
