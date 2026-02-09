# Leasebase Bootstrap Infrastructure

This Terraform configuration creates the **core infrastructure** needed in each AWS account before deploying the application stack. This is a **one-time setup** per environment.

## What This Creates

| Resource | Description |
|----------|-------------|
| **S3 Bucket** | Terraform state storage |
| **DynamoDB Table** | Terraform state locking |
| **VPC** | Virtual private cloud with DNS support |
| **Public Subnets** | For ALB and (in dev) ECS tasks |
| **Private Subnets** | For RDS and (in prod) ECS tasks |
| **NAT Gateway** | Optional, enables private subnet internet access |
| **Security Groups** | For ALB, ECS, and RDS |
| **ECR Repository** | Container registry for API images |
| **GitHub OIDC Provider** | Federated identity for GitHub Actions |
| **IAM Roles** | For GitHub Actions, ECS execution, and ECS tasks |
| **CloudWatch Log Group** | For ECS container logs |
| **RDS Subnet Group** | For database placement |

## Prerequisites

1. AWS CLI configured with credentials for the target account
2. Terraform >= 1.5.0 installed
3. Appropriate IAM permissions to create the resources

## Usage

### 1. Deploy to Development Account

```bash
# Set AWS credentials for dev account
export AWS_PROFILE=leasebase-dev
# OR
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...

# Navigate to bootstrap directory
cd infra/terraform/bootstrap

# Copy and customize the dev configuration
cp dev.tfvars.example dev.tfvars

# Initialize Terraform
terraform init

# Preview changes
terraform plan -var-file=dev.tfvars

# Apply (creates all resources)
terraform apply -var-file=dev.tfvars
```

### 2. Deploy to Production Account

```bash
# Set AWS credentials for prod account
export AWS_PROFILE=leasebase-prod

# Copy and customize the prod configuration
cp prod.tfvars.example prod.tfvars

# Re-initialize for the new account
terraform init -reconfigure

# Preview and apply
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### 3. Configure GitHub Secrets

After applying, the outputs will show the values needed for GitHub secrets:

```bash
terraform output github_secrets_summary
```

Add these secrets to your GitHub repository:
- Settings → Secrets and variables → Actions → New repository secret

**For Development:**
- `AWS_DEV_ROLE_ARN`
- `AWS_DEV_SUBNETS`
- `AWS_DEV_SECURITY_GROUP`

**For Production:**
- `AWS_PROD_ROLE_ARN`
- `AWS_PROD_SUBNETS`
- `AWS_PROD_SECURITY_GROUP`

### 4. Enable Remote State (Optional but Recommended)

After the initial apply, enable remote state storage:

1. Uncomment the `backend "s3"` block in `main.tf`
2. Replace `ENV` with your environment (dev/prod)
3. Run `terraform init -migrate-state`

## Environment Differences

| Setting | Dev | Prod |
|---------|-----|------|
| VPC CIDR | 10.10.0.0/16 | 10.30.0.0/16 |
| NAT Gateway | Disabled | Enabled |
| ECS Subnets | Public | Private |
| Log Retention | 7 days | 30 days |

## Outputs Reference

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC identifier |
| `public_subnet_ids` | Public subnet IDs (list) |
| `private_subnet_ids` | Private subnet IDs (list) |
| `alb_security_group_id` | Security group for ALB |
| `ecs_security_group_id` | Security group for ECS tasks |
| `rds_security_group_id` | Security group for RDS |
| `ecr_repository_url` | ECR repository URL for pushing images |
| `github_actions_role_arn` | IAM role for GitHub Actions |
| `ecs_task_execution_role_arn` | ECS task execution role |
| `ecs_task_role_arn` | ECS task role |

## Next Steps

After bootstrap completes:

1. Push a container image to ECR
2. Deploy the application stack (RDS, ECS service, ALB) using the app-specific Terraform
3. Merge to `Develop` branch to trigger dev deployment
4. Merge to `release` branch to trigger production deployment
