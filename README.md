# Leasebase Monorepo

Real Estate Leasing platform for property managers, owners/landlords, and tenants.

This repository is a TypeScript monorepo that contains:
- The backend API (NestJS + Prisma + PostgreSQL)
- The future web and mobile applications
- Infrastructure and documentation
- Multi‑agent tooling to help plan and execute changes across the stack

If you want to work on Leasebase locally or deploy the backend to AWS, this is the **source of truth**.

---

## Repository layout

- `apps/`
  - `apps/web/` – Web client (frontend will live here; currently a placeholder)
  - `apps/mobile/` – Mobile client (mobile app will live here; currently a placeholder)
- `services/`
  - `services/api/` – NestJS API using Prisma and PostgreSQL (the main backend service)
- `infra/`
  - `infra/terraform/` – Reserved for Terraform infrastructure-as-code (currently a skeleton; see architecture docs for the intended design)
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

### 6. Run the web client (when implemented)

The monorepo is already wired for a web app at `apps/web`.

To start the web client (once it has been implemented):

```bash path=null start=null
npm run dev:web
```

### 7. Run the mobile app (when implemented)

Similarly, the monorepo reserves `apps/mobile` for the mobile client. Once code is added there, you can run:

```bash path=null start=null
npm run dev:mobile
```

### 8. Run API and web together

For convenience you can start Postgres, API, and web (where web exists) from the root:

```bash path=null start=null
npm run dev
```

This will:
- Ensure Postgres is running via Docker Compose
- Start the API (`services/api`)
- Start the web app (`apps/web`)

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

## Backend deployment to AWS (API service)

The backend API lives in `services/api` and uses:
- NestJS (HTTP server)
- Prisma (PostgreSQL ORM)
- PostgreSQL (`DATABASE_URL`)

There is currently **no fully wired Terraform or CI/CD pipeline** in this repo. The steps below describe a **straightforward manual deployment** path using EC2 + RDS, which you can later automate with Terraform under `infra/`.

### 1. Create a PostgreSQL database (RDS)

In AWS:

1. Create an **RDS PostgreSQL** instance (e.g., `db.t3.micro` for dev):
   - Engine: PostgreSQL 14+ (or similar)
   - Public accessibility: for dev you may allow, but for prod prefer private subnets.
2. Create a database user and database (e.g., `leasebase` / `leasebase`).
3. Note the connection parameters and construct `DATABASE_URL`, for example:

```text path=null start=null
postgresql://<USER>:<PASSWORD>@<RDS_ENDPOINT>:5432/<DB_NAME>?schema=public
```

### 2. Provision an EC2 instance for the API

1. Create an **EC2 instance** (e.g., Amazon Linux 2, t3.micro or larger) in the same VPC as RDS.
2. Open a security group rule allowing inbound traffic on the API port (default `4000`), from:
   - Your IP (for dev), or
   - An Application Load Balancer (for prod).
3. SSH into the instance and install runtime dependencies:

```bash path=null start=null
# Update packages
sudo yum update -y

# Install Node.js (use Node 18 or 20)
# Example using nvm or Amazon Linux extras, depending on your base image

# Install git
sudo yum install -y git
```

### 3. Deploy the API code to EC2

On the EC2 instance:

```bash path=null start=null
# Clone the repository
git clone <your-git-url>/leasebase.git
cd leasebase

# Install dependencies
npm install

# Build the API
cd services/api
npm run build
```

Create a `.env` file in `services/api` with at least:

```bash path=null start=null
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<RDS_ENDPOINT>:5432/<DB_NAME>?schema=public"
API_PORT=4000
NODE_ENV=production
```

Then start the API:

```bash path=null start=null
npm start   # runs: node dist/main.js
```

For production, you should run this under a process manager such as **pm2** or a **systemd** service so that it restarts automatically.

### 4. (Optional) Put an Application Load Balancer (ALB) in front

For a more production-ready setup:

1. Create an **Application Load Balancer** targeting the EC2 instance on port `4000`.
2. Attach an **HTTPS listener** and ACM-managed certificate for your API domain (e.g., `api.yourdomain.com`).
3. Restrict security groups so that the EC2 instance only accepts traffic from the ALB, not the entire internet.

### 5. Future: Infrastructure as Code (Terraform)

The `infra/terraform` directory is reserved for a Terraform-based implementation of the target architecture (VPC, ECS/Fargate or EC2, RDS, ALB, CloudFront, S3, Cognito, etc.), as described in `docs/architecture.md`.

Once Terraform modules and variables are defined, the high-level flow will be:

```bash path=null start=null
cd infra/terraform
terraform init
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

(Those files and modules are **not yet committed**, so treat this as a roadmap, not a currently-working command.)

---

## Multi-agent tooling

The `multi_agent/` directory contains a generic multi-agent engine plus a Leasebase-specific CLI wrapper.

From the monorepo root you can ask the multi-agent system to decompose and reason about tasks across web, mobile, and backend:

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
