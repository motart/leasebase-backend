#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
const readline_1 = __importDefault(require("readline"));
const Orchestrator_1 = require("./core/Orchestrator");
const Logger_1 = require("./utils/Logger");
dotenv_1.default.config();
const program = new commander_1.Command();
const logger = new Logger_1.Logger(process.env.LOG_LEVEL || 'info');
program
    .name('ollama-multi-agent')
    .description('Multi-agent orchestration system using Ollama (local LLMs)')
    .version('1.0.0');
program
    .command('run <task>')
    .description('Execute a task using multi-agent orchestration')
    .option('-a, --max-agents <number>', 'Maximum concurrent agents', '5')
    .option('-d, --max-depth <number>', 'Maximum task decomposition depth', '3')
    .option('-o, --output <format>', 'Output format (json|text)', 'text')
    .option('-f, --file <path>', 'Read task from file')
    .option('-m, --model <name>', 'Ollama model to use', 'llama3.2')
    .option('-u, --ollama-url <url>', 'Ollama server URL', 'http://localhost:11434')
    .action(async (task, options) => {
    await runTask(task, options);
});
program
    .command('interactive')
    .description('Start interactive mode')
    .option('-a, --max-agents <number>', 'Maximum concurrent agents', '5')
    .option('-d, --max-depth <number>', 'Maximum task decomposition depth', '3')
    .option('-m, --model <name>', 'Ollama model to use', 'llama3.2')
    .option('-u, --ollama-url <url>', 'Ollama server URL', 'http://localhost:11434')
    .action(async (options) => {
    await runInteractive(options);
});
program
    .command('models')
    .description('List available Ollama models')
    .option('-u, --ollama-url <url>', 'Ollama server URL', 'http://localhost:11434')
    .action(async (options) => {
    await listModels(options);
});
async function listModels(options) {
    const { OllamaClient } = await Promise.resolve().then(() => __importStar(require('./clients/OllamaClient')));
    const client = new OllamaClient(logger, {
        baseUrl: options.ollamaUrl
    });
    const spinner = (0, ora_1.default)('Checking Ollama models...').start();
    try {
        const isHealthy = await client.checkHealth();
        if (!isHealthy) {
            spinner.fail('Ollama is not running');
            console.log(chalk_1.default.yellow('\nPlease start Ollama with: ollama serve'));
            process.exit(1);
        }
        const models = await client.listModels();
        spinner.succeed('Available models:');
        if (models.length === 0) {
            console.log(chalk_1.default.yellow('No models found. Pull a model with: ollama pull llama3.2'));
        }
        else {
            models.forEach(model => {
                console.log(chalk_1.default.green(`  • ${model}`));
            });
        }
    }
    catch (error) {
        spinner.fail('Failed to list models');
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
}
async function runTask(taskInput, options) {
    let task = taskInput;
    let context = '';
    if (options.file && (0, fs_1.existsSync)(options.file)) {
        const fileContent = (0, fs_1.readFileSync)(options.file, 'utf-8');
        const lines = fileContent.split('\n');
        task = lines[0] || taskInput;
        context = lines.slice(1).join('\n');
    }
    const spinner = (0, ora_1.default)('Initializing multi-agent system...').start();
    try {
        const orchestrator = new Orchestrator_1.Orchestrator({
            ollamaUrl: options.ollamaUrl || 'http://localhost:11434',
            model: options.model || 'llama3.2',
            maxConcurrentAgents: parseInt(options.maxAgents || '5'),
            maxTaskDepth: parseInt(options.maxDepth || '3'),
            logger
        });
        await orchestrator.initialize();
        spinner.text = 'Multi-agent system ready';
        orchestrator.on('plan_created', (data) => {
            spinner.succeed('Task decomposition complete');
            console.log(chalk_1.default.blue(`📋 Created ${data.subtaskCount} subtasks across ${data.levels} levels`));
            spinner.start('Executing tasks...');
        });
        orchestrator.on('level_start', (data) => {
            spinner.text = `Processing level ${data.level + 1} (${data.taskCount} tasks)...`;
        });
        orchestrator.on('agent_message', (message) => {
            if (message.type === 'task_assignment') {
                logger.agent(message.agentId, `Starting: ${message.payload.task.description.substring(0, 50)}...`);
            }
            else if (message.type === 'task_result') {
                logger.agent(message.agentId, chalk_1.default.green('✓ Task completed'));
            }
        });
        const result = await orchestrator.execute(task, context);
        spinner.succeed('All tasks completed successfully!');
        if (options.output === 'json') {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            displayResults(result);
        }
        const stats = orchestrator.getStatistics();
        console.log(chalk_1.default.gray('\n📊 Statistics:'));
        console.log(chalk_1.default.gray(`   Total tasks processed: ${stats.tasksProcessed}`));
        console.log(chalk_1.default.gray(`   Completed: ${stats.agentPool.totalCompleted}`));
        console.log(chalk_1.default.gray(`   Failed: ${stats.agentPool.totalFailed}`));
    }
    catch (error) {
        spinner.fail('Execution failed');
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        if (error instanceof Error && error.message.includes('Ollama is not running')) {
            console.log(chalk_1.default.yellow('\nTo install and start Ollama:'));
            console.log(chalk_1.default.gray('1. Download from: https://ollama.ai'));
            console.log(chalk_1.default.gray('2. Run: ollama serve'));
            console.log(chalk_1.default.gray('3. Pull a model: ollama pull llama3.2'));
        }
        process.exit(1);
    }
}
async function runInteractive(options) {
    console.log(chalk_1.default.cyan('🤖 Ollama Multi-Agent Interactive Mode'));
    console.log(chalk_1.default.gray('Type your task and press Enter. Type "exit" to quit.\n'));
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk_1.default.green('> ')
    });
    const orchestrator = new Orchestrator_1.Orchestrator({
        ollamaUrl: options.ollamaUrl || 'http://localhost:11434',
        model: options.model || 'llama3.2',
        maxConcurrentAgents: parseInt(options.maxAgents || '5'),
        maxTaskDepth: parseInt(options.maxDepth || '3'),
        logger
    });
    try {
        await orchestrator.initialize();
        console.log(chalk_1.default.green(`✓ Connected to Ollama (model: ${options.model || 'llama3.2'})\n`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Failed to initialize: ${error instanceof Error ? error.message : String(error)}`));
        if (error instanceof Error && error.message.includes('Ollama is not running')) {
            console.log(chalk_1.default.yellow('\nPlease start Ollama first with: ollama serve'));
        }
        process.exit(1);
    }
    setupOrchestratorListeners(orchestrator);
    rl.prompt();
    rl.on('line', async (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit') {
            console.log(chalk_1.default.yellow('Goodbye!'));
            rl.close();
            process.exit(0);
        }
        if (input.toLowerCase() === 'stats') {
            const stats = orchestrator.getStatistics();
            console.log(chalk_1.default.gray('\n📊 Current Statistics:'));
            console.log(chalk_1.default.gray(`   Tasks processed: ${stats.tasksProcessed}`));
            console.log(chalk_1.default.gray(`   Active agents: ${stats.agentPool.busyAgents}/${stats.agentPool.totalAgents}`));
            console.log(chalk_1.default.gray(`   Completed: ${stats.agentPool.totalCompleted}`));
            console.log(chalk_1.default.gray(`   Failed: ${stats.agentPool.totalFailed}\n`));
            rl.prompt();
            return;
        }
        if (input) {
            const spinner = (0, ora_1.default)('Processing...').start();
            try {
                const result = await orchestrator.execute(input);
                spinner.succeed('Task completed!');
                displayResults(result);
            }
            catch (error) {
                spinner.fail('Task failed');
                console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            }
        }
        rl.prompt();
    });
}
function setupOrchestratorListeners(orchestrator) {
    orchestrator.on('plan_created', (data) => {
        console.log(chalk_1.default.blue(`\n📋 Task decomposed into ${data.subtaskCount} subtasks`));
    });
    orchestrator.on('agent_message', (message) => {
        if (message.type === 'task_assignment') {
            const taskDesc = message.payload.task.description;
            logger.agent(message.agentId, `${taskDesc.substring(0, 60)}...`);
        }
    });
}
function displayResults(result, indent = 0) {
    const spaces = ' '.repeat(indent);
    if (typeof result === 'object' && result !== null) {
        if (result.task) {
            console.log(`${spaces}${chalk_1.default.bold(result.task)}`);
            if (result.status === 'completed') {
                console.log(`${spaces}${chalk_1.default.green('✓')} Status: ${result.status}`);
            }
            else {
                console.log(`${spaces}${chalk_1.default.red('✗')} Status: ${result.status}`);
            }
            if (result.result && typeof result.result === 'string') {
                const lines = result.result.split('\n').slice(0, 3);
                lines.forEach((line) => {
                    if (line.trim()) {
                        console.log(`${spaces}  ${chalk_1.default.gray(line.substring(0, 80))}...`);
                    }
                });
            }
            if (result.subtasks && Array.isArray(result.subtasks)) {
                result.subtasks.forEach((subtask) => {
                    displayResults(subtask, indent + 2);
                });
            }
        }
    }
}
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map