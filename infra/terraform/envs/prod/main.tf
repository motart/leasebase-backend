terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment and configure for remote state
  # backend "s3" {
  #   bucket         = "leasebase-terraform-state-prod"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "leasebase-terraform-locks-prod"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "leasebase"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project     = "leasebase"
  environment = "prod"
}

# VPC
module "vpc" {
  source = "../../modules/vpc"

  project            = local.project
  environment        = local.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = true # Required for production private subnets
}

# ECR Repository
module "ecr" {
  source = "../../modules/ecr"

  project     = local.project
  environment = local.environment
}

# Application Load Balancer
module "alb" {
  source = "../../modules/alb"

  project        = local.project
  environment    = local.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.public_subnet_ids
  container_port = 4000
}

# ECS Cluster and Service
module "ecs" {
  source = "../../modules/ecs"

  project               = local.project
  environment           = local.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids # Private subnets for production
  alb_security_group_id = module.alb.security_group_id
  target_group_arn      = module.alb.target_group_arn
  container_image       = var.api_container_image != "" ? var.api_container_image : "${module.ecr.repository_url}:latest"
  database_url          = var.database_url
  cpu                   = 512  # More resources for production
  memory                = 1024
  desired_count         = 2    # High availability
}

# RDS PostgreSQL
module "rds" {
  source = "../../modules/rds"

  project                 = local.project
  environment             = local.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.security_group_id]
  instance_class          = "db.t3.small" # Larger instance for production
  allocated_storage       = 50
  max_allocated_storage   = 200
  database_name           = "leasebase_prod"
  database_username       = var.db_username
  database_password       = var.db_password
  publicly_accessible     = false
  backup_retention_period = 14 # Longer retention for production
}

# S3 + CloudFront for Web Frontend
module "web" {
  source = "../../modules/s3-cloudfront"

  project       = local.project
  environment   = local.environment
  bucket_suffix = var.web_bucket_suffix
}

# GitHub Actions OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = {
    Name = "github-actions-oidc"
  }
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "${local.project}-${local.environment}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Restrict to release branch only for production
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/release"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${local.project}-${local.environment}-github-actions"
  }
}

# GitHub Actions Policy
resource "aws_iam_role_policy" "github_actions" {
  name = "${local.project}-${local.environment}-github-actions-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = module.ecr.repository_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService",
          "ecs:RunTask"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          module.ecs.task_execution_role_arn,
          module.ecs.task_role_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          module.web.bucket_arn,
          "${module.web.bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = module.web.cloudfront_arn
      }
    ]
  })
}
