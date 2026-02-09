# Leasebase Backend Monorepo

Real Estate Leasing platform for property managers, owners/landlords, and tenants.

This repository is the **backend monorepo** for Leasebase. It contains:
- The backend API (NestJS + Prisma + PostgreSQL)
- Shared backend infrastructure and documentation
- Multi‑agent tooling to help plan and execute backend‑centric and cross‑repo changes

**Frontend code (web and mobile)** lives in separate repositories:
- `leasebase-web` – standalone web client
- `leasebase-mobile` – standalone mobile client

If you want to work on Leasebase locally or deploy the backend to AWS, this is the **source of truth**.

---

## Repository layout

This repo is intentionally **backend‑only**. Frontend projects live in their own repos (`leasebase-web`, `leasebase-mobile`).

- `apps/`
  - Reserved for potential future backend apps/services (not frontends)
- `services/`
  - `services/api/` – NestJS API using Prisma and PostgreSQL (the main backend service)
- `infra/`
  - `infra/terraform/bootstrap` – Terraform for bootstrapping AWS accounts (IAM roles, OIDC for GitHub Actions, basic shared resources). Full app infrastructure (VPC, RDS, ECS/Fargate, ALB, S3/CloudFront, etc.) now lives in the separate `leasebase-iac` repo.
- `docs/`
  - `docs/architecture.md` – High-level system and domain architecture
- `multi_agent/`
  - Multi-agent orchestration engine and CLI used to coordinate work across web, mobile, and backend
- Root files
  - `package.json` – Monorepo configuration and scripts
  - `docker-compose.yml` – Local PostgreSQL database for development
  - `tsconfig.base.json` – Shared TypeScript configuration

---

## Prerequisites

To run Leasebase locally you will need:

- **Node.js** (LTS recommended, e.g. Node 18 or 20)
- **npm** (comes with Node; npm 8+ recommended)
- **Docker** + **Docker Compose** (for local PostgreSQL)
- **Git**

For AWS deployment of the backend you will additionally need:

- An **AWS account** and appropriate IAM permissions
- **AWS CLI** configured with credentials (`aws configure`)
- A basic understanding of VPCs, security groups, and RDS/EC2 (or ECS) concepts

---

## Local development setup

### 1. Clone the repo

```bash path=null start=null
git clone <your-git-url>/leasebase.git
cd leasebase
```

### 2. Install dependencies

This will install dependencies for the monorepo and all workspaces (`apps/*`, `services/*`).

```bash path=null start=null
npm install
```

### 3. Start the local PostgreSQL database

The repo includes a simple Postgres instance via Docker Compose:

```bash path=null start=null
# From the repo root
docker-compose up -d db
```

Default connection details (as defined in `docker-compose.yml`):
- Host: `localhost`
- Port: `5432`
- User: `leasebase`
- Password: `leasebase`
- Database: `leasebase`

The Prisma datasource in `services/api/prisma/schema.prisma` uses the `DATABASE_URL` environment variable; by default you should set something like:

```bash path=null start=null
export DATABASE_URL="postgresql://leasebase:leasebase@localhost:5432/leasebase?schema=public"
```

You can place this in a local `.env` file for convenience.

### 4. Run database migrations & seed data (optional but recommended)

From the monorepo root:

```bash path=null start=null
# Apply Prisma migrations
npm run migrate

# Seed initial data
npm run seed
```

These commands delegate to scripts under `services/api`.

### 5. Run the backend API locally

To start just the API in watch mode:

```bash path=null start=null
npm run dev:api
```

This runs NestJS from `services/api`, listening on:
- Port: `4000` by default (configurable via `API_PORT` env var)

Swagger API docs are exposed at:
- `http://localhost:4000/docs`

### 6. Authentication (AWS Cognito)

The backend API uses **AWS Cognito** for authentication from the start. It does **not** issue tokens or handle user registration itself; instead it validates **Cognito access tokens** sent as Bearer tokens.

#### Required environment variables

In `services/api` (or the shell where you run the API), set:

```bash path=null start=null
COGNITO_REGION=us-west-2                # or your region
COGNITO_USER_POOL_ID=us-west-2_XXXXXXX  # Cognito User Pool ID
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx  # App client ID for web
```

These are used to construct the expected JWT **issuer** and **JWKS** URL:

- Issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
- JWKS: `${issuer}/.well-known/jwks.json`

The API verifies incoming Bearer tokens against this JWKS and checks the `aud` (audience) claim matches `COGNITO_CLIENT_ID`.

#### Dev-only auth bypass (for tests only)

For certain local or test scenarios you can enable a **dev-only** auth bypass. This is **disabled by default** and must never be used in production.

```bash path=null start=null
DEV_AUTH_BYPASS=true
```

When this flag is set, you can simulate an authenticated user via headers:

- `x-dev-user-email` – user email
- `x-dev-user-role` – one of `ORG_ADMIN | PM_STAFF | OWNER | TENANT`
- `x-dev-org-id` – organization id

The backend will upsert a matching `Organization` + `User` record and treat that as the current user. When `DEV_AUTH_BYPASS` is not `true`, these headers are ignored and a real Cognito token is required.

#### Auth endpoints

- `GET /auth/me`
  - Protected endpoint (requires Bearer token).
  - Returns the normalized current user:
    - `id`, `orgId`, `email`, `name`, `role`.
  - Documented in Swagger as `CurrentUserDto` under the `auth` tag.

- `GET /auth/config`
  - **Public** endpoint (no auth required).
  - Returns the Cognito configuration the API is using:
    - `region`, `userPoolId`, `clientId`, `issuer`, `jwksUri`.
  - Useful for debugging and for verifying that the backend is pointed at the expected user pool.

To use these with Swagger:

1. Obtain an **access token** from Cognito (e.g. via the Hosted UI from the web app).
2. In Swagger (`/docs`), click **Authorize**, select the bearer scheme, and paste the token.
3. Call `GET /auth/me` to verify the token is accepted.

### 7. Frontend applications (separate repos)

This backend monorepo does **not** contain the web or mobile UI code.

Frontend projects live in their own repositories:
- `leasebase-web` – web client
- `leasebase-mobile` – mobile client

Those repos are expected to talk to this backend API over HTTP (for example, `http://localhost:4000` in local development, or an AWS host in dev/stage/prod).

### 8. Run API and frontend together locally

A typical local workflow looks like:

1. From this repo, start Postgres and the API:

   ```bash path=null start=null
   # In ../leasebase (backend monorepo)
   docker-compose up -d db
   npm install
   npm run migrate
   npm run seed
   npm run dev:api
   ```

2. From `../leasebase-web`, start the web client (once implemented):

   ```bash path=null start=null
   cd ../leasebase-web
   npm install
   npm run dev
   ```

3. From `../leasebase-mobile`, start the mobile client (once implemented):

   ```bash path=null start=null
   cd ../leasebase-mobile
   npm install
   npm start
   ```

The web and mobile apps should be configured to use the API base URL exposed by this backend (e.g., `http://localhost:4000`).

---

## Testing & linting

From the monorepo root:

```bash path=null start=null
# Run API + web tests
npm test

# API-only tests
npm run test:api

# Web-only tests (once implemented)
npm run test:web

# Lint API + web
npm run lint

# Lint API-only
npm run lint:api

# Lint web-only (once implemented)
npm run lint:web
```

---

## Backend deployment to AWS

The backend API lives in `services/api` and uses:
- NestJS (HTTP server)
- Prisma (PostgreSQL ORM)
- PostgreSQL (`DATABASE_URL`)
- AWS Cognito for authentication (see **Authentication** section above)

### Infrastructure layout

This repository now contains **bootstrap-only** Terraform under:

- `infra/terraform/bootstrap` – used to bootstrap AWS accounts (e.g., IAM roles, GitHub OIDC provider, and other shared prerequisites).

The **full application infrastructure** (VPC, RDS, ECS/Fargate services, ALB, S3/CloudFront for web, etc.) is defined in the separate **`leasebase-iac`** repository. That repo is the source of truth for environment-specific stacks (dev/QA/prod).

Each environment is expected to run in its **own AWS account**. You select the account via AWS credentials or `AWS_PROFILE` when running Terraform in `leasebase-iac`.

### 1. Overview of what Terraform creates

For each environment (dev, QA, prod), Terraform provisions:

- Networking
  - A VPC with environment-specific CIDR (e.g., `10.10.0.0/16` for dev, `10.20.0.0/16` for QA, `10.30.0.0/16` for prod)
  - Two public subnets and an internet gateway
- Database (backend)
  - A PostgreSQL RDS instance (size and storage vary by env)
- Backend API
  - ECS Fargate cluster, task definition, and service
  - Application Load Balancer (ALB) with HTTP listener and health checks
- Web frontend
  - S3 bucket for static assets
  - CloudFront distribution in front of the S3 bucket

The web and mobile repos then point at the appropriate API + web endpoints for each environment.

### 2. Deploy dev environment

From the backend repo:

```bash path=null start=null
cd infra/terraform/envs/dev

# Select the dev AWS account
export AWS_PROFILE=leasebase-dev

# Required sensitive values (example: use tfvars or env vars in practice)
export TF_VAR_db_password="<dev-db-password>"
export TF_VAR_api_database_url="postgresql://leasebase:<dev-db-password>@<dev-rds-endpoint>:5432/leasebase_dev?schema=public"

# Non-sensitive values
export TF_VAR_api_container_image="<dev-api-ecr-uri>:latest"
export TF_VAR_web_bucket_suffix="dev-<account-id-or-unique>"

terraform init
terraform plan
terraform apply
```

After apply completes, Terraform outputs (among others):

- `api_alb_dns_name` – base URL for the API in this environment
- `web_cloudfront_domain` – CloudFront domain serving the web client

Use these in `leasebase-web` and `leasebase-mobile` as the base URLs for dev.

### 3. Deploy QA and production environments

Repeat the same pattern in the QA and prod env folders, using the correct AWS account/profile and values:

```bash path=null start=null
# QA
cd infra/terraform/envs/qa
export AWS_PROFILE=leasebase-qa
# Set TF_VAR_db_password, TF_VAR_api_database_url, TF_VAR_api_container_image, TF_VAR_web_bucket_suffix
terraform init
terraform apply

# Production
cd ../prod
export AWS_PROFILE=leasebase-prod
# Set TF_VAR_db_password, TF_VAR_api_database_url, TF_VAR_api_container_image, TF_VAR_web_bucket_suffix
terraform init
terraform apply
```

Environment-specific `variables.tf` files in each folder control sizes (RDS instance class, storage, ECS task counts) and can be tuned independently for dev, QA, and prod.

### 4. Deploying new API/web versions

Once the infrastructure is in place:

- **Backend API:**
  - Build and push a new Docker image for `services/api` to ECR.
  - Update `TF_VAR_api_container_image` (or the corresponding value in your CI pipeline) and re-run `terraform apply`, or
  - Use a deployment tool that updates the ECS service to point at the new task definition.

- **Web frontend:**
  - In `leasebase-web`, build the static site and sync it to the S3 bucket output by Terraform (for each env):

    ```bash path=null start=null
    # In ../leasebase-web
    npm run build
    aws s3 sync ./out s3://<web_bucket_name-from-terraform>/ --delete
    ```

  - The CloudFront distribution created by Terraform serves the updated assets; you can add cache invalidation as needed.

### 5. CI/CD Automated Deployments

This repository includes GitHub Actions workflows for automated deployments:

- **Development** (`Develop` branch → Dev AWS account)
  - Workflow: `.github/workflows/deploy-develop.yml`
  - Triggers on push to `Develop` branch
  - Deploys to dev ECS cluster with Fargate Spot (cost optimized)

- **Production** (`release` branch → Prod AWS account)
  - Workflow: `.github/workflows/deploy-production.yml`
  - Triggers on push to `release` branch
  - Deploys to prod ECS cluster with Fargate (high availability)

#### GitHub Secrets Required

For **Development** environment:
- `AWS_DEV_ROLE_ARN` – IAM role ARN from `terraform output github_actions_role_arn`
- `AWS_DEV_SUBNETS` – Subnet IDs from `terraform output public_subnet_ids`
- `AWS_DEV_SECURITY_GROUP` – Security group from `terraform output ecs_security_group_id`

For **Production** environment:
- `AWS_PROD_ROLE_ARN` – IAM role ARN from `terraform output github_actions_role_arn`
- `AWS_PROD_SUBNETS` – Subnet IDs from `terraform output private_subnet_ids`
- `AWS_PROD_SECURITY_GROUP` – Security group from `terraform output ecs_security_group_id`

#### GitHub Environments

Create two environments in GitHub repository settings:
1. `development` – No protection rules required
2. `production` – Recommended: require reviewers for deployment approval

#### OIDC Authentication

The workflows use GitHub OIDC for AWS authentication (no long-lived credentials). The Terraform configuration creates:
- OIDC identity provider in each AWS account
- IAM role with trust policy for GitHub Actions
- Least-privilege permissions for ECR, ECS, S3, and CloudFront

---

## Multi-agent tooling

The `multi_agent/` directory contains a generic multi-agent engine plus a Leasebase-specific CLI wrapper.

From the backend monorepo root you can ask the multi-agent system to decompose and reason about tasks across backend, web, and mobile **as separate repos**:

```bash path=null start=null
npm run multi-agent -- "Design the MVP tenant onboarding flow across web, mobile, and backend" --domain all
```

Domains:
- `all` – plan work across web, mobile, and backend
- `web` – focus on the web client
- `mobile` – focus on the mobile app
- `api` – focus on the NestJS API

This is especially useful for generating implementation plans, API contracts, and step-by-step changes that touch multiple parts of the monorepo.

---

## Further reading

- `docs/architecture.md` – detailed system and domain architecture
- `services/api/prisma/schema.prisma` – source of truth for the data model
- `services/api/src` – NestJS modules, controllers, and services for the backend API
