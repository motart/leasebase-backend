output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS address (hostname)"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.database_username}:${var.database_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}?schema=public"
  sensitive   = true
}
