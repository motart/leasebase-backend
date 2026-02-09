output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

output "api_alb_dns_name" {
  description = "API ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = module.ecs.security_group_id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "rds_connection_string" {
  description = "RDS connection string"
  value       = module.rds.connection_string
  sensitive   = true
}

output "web_bucket_name" {
  description = "Web S3 bucket name"
  value       = module.web.bucket_name
}

output "web_cloudfront_domain" {
  description = "Web CloudFront domain"
  value       = module.web.cloudfront_domain_name
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}
