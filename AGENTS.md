# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository status

As of February 2, 2026, this repository only contains `README.md` and an empty git history. No application code, tooling configuration, or documentation beyond the one-line project description has been committed yet.

## Project description

From `README.md`:
- This repository is intended to become a "Real Estate Leasing platform for Property Managers and Owners/landlords and tenants".

Before assuming any particular tech stack (frontend framework, backend framework, database, etc.), inspect the latest repository contents or confirm with the project owner, since none of that is currently defined in code.

## Commands

There are no documented build, lint, or test commands yet, and no configuration files (such as `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `Makefile`, or CI configuration) are present in the repository.

When the implementation and tooling are added, update this section with:
- How to run the application in development (including any required environment variables or services).
- How to run the full test suite.
- How to run a single test (or a focused subset), following the conventions of the chosen test framework.
- How to run linting / formatting / type-checking, if applicable.

Until then, there are no canonical commands for Warp to run beyond standard git operations.

## Architecture and structure

There is currently no committed code, so there is no concrete architecture to describe.

Once code is added, this section should be updated to summarize, at a high level:
- The main application layers (e.g., API/backend services, frontend/web client, background jobs, infrastructure as code) and how they interact.
- The primary domain modules or bounded contexts (for example, if they are introduced later: "Leases", "Properties", "Tenants", "Payments", etc.), and which parts of the codebase own them.
- Any cross-cutting concerns implemented in shared modules (authentication, authorization, logging, configuration, error handling, etc.).
- How external services (payment processors, notification services, identity providers, etc.) are integrated and where those integrations live in the code.

Keep this description focused on the big-picture structure that requires reading multiple files to understand (e.g., how services are wired together), rather than listing every directory or file.

## Notes for future agents

- Re-scan the repository structure before making assumptions about the stack or framework; this project is currently a blank slate.
- After the initial implementation lands, prioritize updating this `AGENTS.md` with:
  - Verified development commands.
  - A concise description of the actual architecture that emerges in code.
  - Any project-specific conventions (naming, error-handling patterns, testing strategy, etc.) that are documented elsewhere (e.g., in `README.md`, `CONTRIBUTING.md`, or dedicated docs).
