#!/usr/bin/env node

const path = require('path');
const { Orchestrator } = require('./dist/core/Orchestrator');
const { Logger } = require('./dist/utils/Logger');

async function main() {
  const [, , ...argv] = process.argv;

  if (argv.length === 0) {
    console.error('Usage: node multi_agent/leasebase-cli.js <task description> [--domain web|mobile|api|all]');
    process.exit(1);
  }

  // Very small arg parser: extract optional --domain/-d
  let domain = 'all';
  const domainFlagIndex = argv.findIndex(
    (arg) => arg === '--domain' || arg === '-d'
  );

  if (domainFlagIndex !== -1 && argv[domainFlagIndex + 1]) {
    domain = argv[domainFlagIndex + 1];
    argv.splice(domainFlagIndex, 2);
  }

  const taskDescription = argv.join(' ');

  const repoRoot = path.resolve(__dirname, '..');

  const baseContext = `You are an AI software engineer working on the Leasebase monorepo.

Repository layout (relative to ${repoRoot}):
- Web client: apps/web (frontend implementation will live here).
- Mobile client: apps/mobile (mobile implementation will live here).
- Backend API: services/api (NestJS application using Prisma and PostgreSQL defined in docker-compose.yml).

There may also be separate standalone apps in sibling directories:
- leasebase-web
- leasebase-mobile

The Postgres database is provided via docker-compose.yml (service name: db, image: postgres:16).`;

  const domainContexts = {
    web: `${baseContext}

You are currently focusing on WEB concerns.
- Prioritize frontend architecture, components, routing, and UI/UX flows.
- When suggesting code changes, reference files under apps/web (or leasebase-web if that is where the web app lives) using relative paths.
- Coordinate with the backend API in services/api for data fetching, authentication, and mutations.
- Clearly call out any API changes you require from the NestJS backend so backend agents can implement them.`,

    mobile: `${baseContext}

You are currently focusing on MOBILE concerns.
- Prioritize mobile app screens, navigation, and platform-specific considerations.
- When suggesting code changes, reference files under apps/mobile (or leasebase-mobile if that is where the mobile app lives).
- Coordinate with the backend API in services/api for authentication, data fetching, and push-like flows.
- Clearly specify any new or updated API endpoints you need so backend agents can implement them.`,

    api: `${baseContext}

You are currently focusing on BACKEND/API concerns.
- The backend is a NestJS application in services/api using Prisma for database access and PostgreSQL via docker-compose.yml.
- Follow NestJS conventions: modules, controllers, services, DTOs, and providers.
- For data model changes, update the Prisma schema and related migrations.
- Ensure new endpoints are well-typed, validated, and documented (e.g., via Swagger decorators where appropriate).
- Consider cross-cutting concerns such as logging, configuration, security, and rate limiting.`,

    all: `${baseContext}

You are coordinating WORK ACROSS WEB, MOBILE, AND BACKEND.
- Decompose the task into subtasks that clearly indicate which layer they belong to (web, mobile, api, or cross-cutting).
- For each subtask, specify the target directory and file(s), and the concrete change to make.
- Ensure contracts between frontend/mobile and backend are explicit: list endpoint paths, request/response shapes, and error handling.
- Pay attention to sequencing (e.g., design API first, then integrate from web and mobile).
- When in doubt, propose a minimal viable change that keeps the system consistent end-to-end.`,
  };

  const context =
    domainContexts[domain] || `${baseContext}

No specific domain was selected; assume the task may touch web, mobile, and backend.`;

  const logger = new Logger('info');

  const orchestrator = new Orchestrator({
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    maxConcurrentAgents:
      process.env.MULTI_AGENT_MAX_AGENTS
        ? parseInt(process.env.MULTI_AGENT_MAX_AGENTS, 10)
        : 5,
    maxTaskDepth:
      process.env.MULTI_AGENT_MAX_DEPTH
        ? parseInt(process.env.MULTI_AGENT_MAX_DEPTH, 10)
        : 3,
    logger,
  });

  orchestrator.on('plan_created', (data) => {
    logger.info(
      `Created ${data.subtaskCount} subtasks across ${data.levels} levels for main task: "${data.mainTask.description}"`
    );
  });

  orchestrator.on('level_start', (data) => {
    logger.info(`Starting level ${data.level} with ${data.taskCount} task(s).`);
  });

  orchestrator.on('agent_message', (message) => {
    if (message.type === 'task_assignment') {
      logger.agent(
        message.agentId,
        `Assigned task ${message.taskId}: ${message.payload?.description || ''}`.trim()
      );
    } else if (message.type === 'task_result') {
      logger.agent(
        message.agentId,
        `Completed task ${message.taskId}`
      );
    } else if (message.type === 'error') {
      logger.error(
        `[${message.agentId}] Error on task ${message.taskId || ''}: ${message.payload}`
      );
    }
  });

  try {
    logger.info('Initializing Leasebase multi-agent orchestrator...');
    await orchestrator.initialize();
    logger.info('Initialization complete. Executing task...');

    const result = await orchestrator.execute(taskDescription, context);
    const stats = orchestrator.getStatistics();

    console.log('\n=== Result ===');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n=== Statistics ===');
    console.log(
      JSON.stringify(
        {
          tasksProcessed: stats.tasksProcessed,
          agentPool: stats.agentPool,
          executionPlan: stats.executionPlan,
          domain,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error('\nExecution failed.');
    console.error('Error:', err?.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err?.message || err);
  process.exit(1);
});
