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
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const readline_1 = __importDefault(require("readline"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const Orchestrator_1 = require("./core/Orchestrator");
const Logger_1 = require("./utils/Logger");
const events_1 = require("events");
const os = __importStar(require("os"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ClaudeLikeUI extends events_1.EventEmitter {
    orchestrator;
    logger;
    rl;
    isProcessing = false;
    workLog = [];
    currentSpinner;
    model;
    ollamaProcess;
    constructor() {
        super();
        this.logger = new Logger_1.Logger('error'); // Suppress debug logs
        this.model = process.env.OLLAMA_MODEL || 'llama3.2';
        this.orchestrator = new Orchestrator_1.Orchestrator({
            ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: this.model,
            maxConcurrentAgents: 3, // Reduced for local LLMs
            maxTaskDepth: 2, // Reduced to prevent too many subtasks
            logger: this.logger
        });
        this.rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: ''
        });
        this.setupOrchestratorListeners();
    }
    async start() {
        console.clear();
        this.printHeader();
        // Check and start Ollama if needed
        await this.ensureOllamaRunning();
        this.printPrompt();
        this.rl.on('line', async (input) => {
            await this.handleInput(input);
        });
        this.rl.on('SIGINT', () => {
            this.handleExit();
        });
        // Handle process exit to cleanup Ollama
        process.on('exit', () => {
            if (this.ollamaProcess) {
                this.ollamaProcess.kill();
            }
        });
        // Keep the process alive
        process.stdin.resume();
    }
    async promptForInstall() {
        console.log(chalk_1.default.yellow('\nOllama is not installed. Would you like to install it now?'));
        console.log(chalk_1.default.gray('This is a one-time setup that takes about 1 minute.\n'));
        return new Promise((resolve) => {
            const rl = readline_1.default.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(chalk_1.default.cyan('Install Ollama? (Y/n): '), (answer) => {
                rl.close();
                resolve(answer.toLowerCase() !== 'n');
            });
        });
    }
    async installOllama() {
        const spinner = (0, ora_1.default)('Installing Ollama...').start();
        try {
            // Detect platform
            const platform = os.platform();
            if (platform === 'win32') {
                spinner.fail('Windows detected. Please install Ollama manually:');
                console.log(chalk_1.default.cyan('\nDownload from: https://ollama.ai/download/windows\n'));
                return false;
            }
            if (platform === 'darwin') {
                // macOS - download the app
                spinner.text = 'Opening Ollama download page for macOS...';
                console.log(chalk_1.default.yellow('\n\nPlease install Ollama for macOS:'));
                console.log(chalk_1.default.cyan('1. Download from: https://ollama.ai/download/mac'));
                console.log(chalk_1.default.cyan('2. Open the downloaded Ollama.app'));
                console.log(chalk_1.default.cyan('3. Run this command again\n'));
                // Try to open the download page
                try {
                    await execAsync('open https://ollama.ai/download/mac');
                    spinner.succeed('Opened Ollama download page');
                }
                catch {
                    spinner.info('Please visit: https://ollama.ai/download/mac');
                }
                return false;
            }
            // For Linux only
            spinner.text = 'Downloading and installing Ollama (this may take a minute)...';
            const { stdout, stderr } = await execAsync('curl -fsSL https://ollama.ai/install.sh | sh', {
                shell: '/bin/bash'
            });
            // Check if installation was successful
            try {
                await execAsync('which ollama');
                spinner.succeed('Ollama installed successfully!');
                console.log(chalk_1.default.gray('Ollama has been installed on your system.\n'));
                return true;
            }
            catch {
                spinner.fail('Installation completed but Ollama not found in PATH');
                console.log(chalk_1.default.yellow('You may need to restart your terminal or add Ollama to your PATH.'));
                return false;
            }
        }
        catch (error) {
            spinner.fail('Failed to install Ollama');
            console.log(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            console.log(chalk_1.default.yellow('\nYou can install manually:'));
            if (os.platform() === 'darwin') {
                console.log(chalk_1.default.cyan('Download from: https://ollama.ai/download/mac\n'));
            }
            else {
                console.log(chalk_1.default.cyan('curl -fsSL https://ollama.ai/install.sh | sh\n'));
            }
            return false;
        }
    }
    async ensureOllamaRunning() {
        const spinner = (0, ora_1.default)('Checking Ollama...').start();
        try {
            // First check if Ollama is installed
            try {
                await execAsync('which ollama');
            }
            catch {
                spinner.stop();
                // Offer to install Ollama
                const shouldInstall = await this.promptForInstall();
                if (shouldInstall) {
                    const installed = await this.installOllama();
                    if (!installed) {
                        console.log(chalk_1.default.gray('After installation, run this command again.'));
                        process.exit(1);
                    }
                    // Continue with the flow after successful installation
                    spinner.start('Checking Ollama...');
                }
                else {
                    console.log(chalk_1.default.yellow('\nTo install Ollama later:'));
                    if (os.platform() === 'darwin') {
                        console.log(chalk_1.default.cyan('Download from: https://ollama.ai/download/mac\n'));
                    }
                    else {
                        console.log(chalk_1.default.cyan('curl -fsSL https://ollama.ai/install.sh | sh\n'));
                    }
                    console.log(chalk_1.default.gray('After installation, run this command again.'));
                    process.exit(1);
                }
            }
            // Try to connect to existing Ollama instance
            try {
                const { OllamaClient } = await Promise.resolve().then(() => __importStar(require('./clients/OllamaClient')));
                const testClient = new OllamaClient(this.logger);
                const isHealthy = await testClient.checkHealth();
                if (!isHealthy) {
                    throw new Error('Ollama not running');
                }
            }
            catch {
                throw new Error('Ollama not running');
            }
            // Ollama is running, now initialize orchestrator
            await this.orchestrator.initialize();
            spinner.succeed(`Connected to Ollama (${this.model})`);
            console.log('');
            return;
        }
        catch (error) {
            // Ollama not running, try to start it
            const platform = os.platform();
            if (platform === 'darwin') {
                // On macOS, try to launch the Ollama app
                spinner.text = 'Starting Ollama app...';
                try {
                    // Check if Ollama.app exists
                    try {
                        await execAsync('ls /Applications/Ollama.app');
                    }
                    catch {
                        // Try in user Applications
                        try {
                            await execAsync('ls ~/Applications/Ollama.app');
                        }
                        catch {
                            spinner.fail('Ollama app not found. Please ensure Ollama.app is installed.');
                            console.log(chalk_1.default.yellow('\nDownload from: https://ollama.ai/download/mac'));
                            process.exit(1);
                        }
                    }
                    // Launch Ollama app
                    await execAsync('open -a Ollama');
                    spinner.text = 'Waiting for Ollama to start...';
                    // Wait for Ollama to start (may take a few seconds)
                    let connected = false;
                    for (let i = 0; i < 10; i++) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        try {
                            await this.orchestrator.initialize();
                            connected = true;
                            break;
                        }
                        catch {
                            // Keep trying
                        }
                    }
                    if (connected) {
                        spinner.succeed(`Ollama started and connected (${this.model})`);
                        console.log('');
                        // Check if we need to pull the model
                        try {
                            await this.orchestrator.initialize();
                            return;
                        }
                        catch (initError) {
                            if (initError instanceof Error && initError.message.includes('not found')) {
                                spinner.text = `Pulling model ${this.model}... (this may take a few minutes)`;
                                try {
                                    await execAsync(`ollama pull ${this.model}`);
                                    await this.orchestrator.initialize();
                                    spinner.succeed(`Model ${this.model} downloaded and ready`);
                                    console.log('');
                                    return;
                                }
                                catch (pullError) {
                                    spinner.fail(`Failed to pull model ${this.model}`);
                                    console.log(chalk_1.default.red(pullError instanceof Error ? pullError.message : String(pullError)));
                                    process.exit(1);
                                }
                            }
                            throw initError;
                        }
                    }
                    else {
                        spinner.fail('Ollama app started but connection failed');
                        console.log(chalk_1.default.yellow('Please ensure Ollama is running (check menu bar)'));
                        process.exit(1);
                    }
                }
                catch (error) {
                    spinner.fail('Failed to start Ollama app');
                    console.log(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
                    process.exit(1);
                }
            }
            else {
                // Linux - use ollama serve
                spinner.text = 'Starting Ollama server...';
                try {
                    // Start Ollama in background
                    this.ollamaProcess = (0, child_process_1.spawn)('ollama', ['serve'], {
                        detached: false,
                        stdio: 'ignore'
                    });
                    // Wait a bit for server to start
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    // Try to initialize again
                    try {
                        await this.orchestrator.initialize();
                        spinner.succeed(`Started Ollama and connected (${this.model})`);
                        console.log(chalk_1.default.gray('(Ollama will stop when you exit)\n'));
                        return;
                    }
                    catch (initError) {
                        // Check if we need to pull the model
                        if (initError instanceof Error && initError.message.includes('not found')) {
                            spinner.text = `Pulling model ${this.model}... (this may take a few minutes)`;
                            try {
                                await execAsync(`ollama pull ${this.model}`);
                                await this.orchestrator.initialize();
                                spinner.succeed(`Model ${this.model} downloaded and ready`);
                                console.log('');
                                return;
                            }
                            catch (pullError) {
                                spinner.fail(`Failed to pull model ${this.model}`);
                                console.log(chalk_1.default.red(pullError instanceof Error ? pullError.message : String(pullError)));
                                process.exit(1);
                            }
                        }
                        throw initError;
                    }
                }
                catch (error) {
                    spinner.fail('Failed to start Ollama');
                    console.log(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
                    console.log(chalk_1.default.yellow('\nPlease try starting Ollama manually:'));
                    console.log(chalk_1.default.gray('ollama serve'));
                    process.exit(1);
                }
            }
        }
    }
    printHeader() {
        console.log(chalk_1.default.bold('━'.repeat(80)));
        console.log(chalk_1.default.bold.cyan('  Multi-Agent System'));
        console.log(chalk_1.default.gray('  Powered by Ollama • Type /help for commands'));
        console.log(chalk_1.default.bold('━'.repeat(80)));
        console.log('');
    }
    printPrompt() {
        if (!this.isProcessing) {
            process.stdout.write(chalk_1.default.bold.green('You\n'));
            process.stdout.write('> ');
        }
    }
    async handleInput(input) {
        const trimmed = input.trim();
        if (!trimmed) {
            this.printPrompt();
            return;
        }
        // Handle commands
        if (trimmed.startsWith('/')) {
            await this.handleCommand(trimmed);
            return;
        }
        // Process task
        await this.processTask(trimmed);
    }
    async handleCommand(command) {
        const [cmd, ...args] = command.split(' ');
        switch (cmd) {
            case '/help':
                this.printHelp();
                break;
            case '/clear':
                console.clear();
                this.printHeader();
                break;
            case '/log':
                this.showWorkLog();
                break;
            case '/stats':
                this.showStats();
                break;
            case '/model':
                if (args[0]) {
                    await this.changeModel(args[0]);
                }
                else {
                    console.log(chalk_1.default.gray(`Current model: ${this.model}`));
                }
                break;
            case '/models':
                await this.listModels();
                break;
            case '/exit':
            case '/quit':
                this.handleExit();
                break;
            default:
                console.log(chalk_1.default.red(`Unknown command: ${cmd}`));
                console.log(chalk_1.default.gray('Type /help for available commands'));
        }
        console.log('');
        this.printPrompt();
    }
    printHelp() {
        console.log(chalk_1.default.bold('\nAvailable Commands:'));
        console.log(chalk_1.default.gray('  /help    - Show this help message'));
        console.log(chalk_1.default.gray('  /clear   - Clear the screen'));
        console.log(chalk_1.default.gray('  /log     - Show work log'));
        console.log(chalk_1.default.gray('  /stats   - Show statistics'));
        console.log(chalk_1.default.gray('  /model   - Show or change model (e.g., /model mistral)'));
        console.log(chalk_1.default.gray('  /models  - List available models'));
        console.log(chalk_1.default.gray('  /exit    - Exit the application'));
    }
    async listModels() {
        const spinner = (0, ora_1.default)('Fetching available models...').start();
        try {
            const { stdout } = await execAsync('ollama list');
            spinner.stop();
            console.log(chalk_1.default.bold('\nAvailable Models:'));
            const lines = stdout.split('\n').slice(1); // Skip header
            lines.forEach(line => {
                if (line.trim()) {
                    const [name] = line.split(/\s+/);
                    console.log(chalk_1.default.gray(`  • ${name}`));
                }
            });
            if (lines.filter(l => l.trim()).length === 0) {
                console.log(chalk_1.default.gray('  No models installed yet.'));
                console.log(chalk_1.default.gray('  Pull one with: /model llama3.2'));
            }
        }
        catch (error) {
            spinner.fail('Failed to list models');
            console.log(chalk_1.default.gray('  No models found. Pull one with: /model llama3.2'));
        }
    }
    async processTask(task) {
        this.isProcessing = true;
        console.log('');
        console.log(chalk_1.default.bold.blue('Assistant'));
        this.workLog = [];
        this.addToWorkLog('Task received', task);
        try {
            console.log(chalk_1.default.gray('Processing your request...'));
            const result = await this.orchestrator.execute(task);
            this.displayResult(result);
        }
        catch (error) {
            console.log(chalk_1.default.red('\n✗ Task failed'));
            console.log(chalk_1.default.gray(error instanceof Error ? error.message : String(error)));
            if (error instanceof Error && error.stack) {
                console.log(chalk_1.default.gray('Stack trace:', error.stack));
            }
        }
        this.isProcessing = false;
        console.log('');
        this.printPrompt();
    }
    setupOrchestratorListeners() {
        this.orchestrator.on('plan_created', (data) => {
            this.addToWorkLog('Plan created', `${data.subtaskCount} subtasks across ${data.levels} levels`);
            console.log(chalk_1.default.gray(`\n📋 Breaking down task into ${data.subtaskCount} subtasks...`));
        });
        this.orchestrator.on('level_start', (data) => {
            this.addToWorkLog('Level started', `Level ${data.level + 1} with ${data.taskCount} tasks`);
        });
        this.orchestrator.on('agent_message', (message) => {
            if (message.type === 'task_assignment') {
                const taskDesc = message.payload.task.description;
                this.addToWorkLog('Task assigned', `${message.agentId}: ${taskDesc}`);
                // Show progress for each agent
                if (!this.currentSpinner) {
                    this.currentSpinner = (0, ora_1.default)({
                        text: chalk_1.default.gray(`Working on subtasks...`),
                        spinner: 'dots'
                    }).start();
                }
                this.currentSpinner.text = chalk_1.default.gray(`${message.agentId}: ${taskDesc.substring(0, 50)}...`);
            }
            else if (message.type === 'task_result') {
                this.addToWorkLog('Task completed', message.agentId);
            }
            else if (message.type === 'error') {
                this.addToWorkLog('Task failed', `${message.agentId}: ${message.payload.error}`);
            }
        });
        this.orchestrator.on('complete', () => {
            if (this.currentSpinner) {
                this.currentSpinner.succeed(chalk_1.default.green('All subtasks completed'));
                this.currentSpinner = undefined;
            }
        });
    }
    displayResult(result) {
        console.log('');
        if (!result) {
            console.log(chalk_1.default.gray('No result received.'));
            return;
        }
        if (typeof result === 'string') {
            console.log(result);
        }
        else if (result && result.result) {
            // Display main result
            if (typeof result.result === 'string') {
                const lines = result.result.split('\n');
                lines.forEach((line) => {
                    if (line.trim()) {
                        console.log(line);
                    }
                });
            }
            else {
                console.log(chalk_1.default.gray('Result:', JSON.stringify(result.result, null, 2)));
            }
            // Show subtask summary if available
            if (result.subtasks && result.subtasks.length > 0) {
                console.log(chalk_1.default.gray('\n' + '─'.repeat(40)));
                console.log(chalk_1.default.gray('Subtask Summary:'));
                this.printSubtasks(result.subtasks, 0);
            }
        }
        else {
            console.log(chalk_1.default.gray('Result:', JSON.stringify(result, null, 2)));
        }
    }
    printSubtasks(subtasks, indent) {
        subtasks.forEach(subtask => {
            const spaces = ' '.repeat(indent + 2);
            if (subtask.status === 'completed') {
                console.log(chalk_1.default.gray(`${spaces}✓ ${subtask.task}`));
            }
            else {
                console.log(chalk_1.default.gray(`${spaces}✗ ${subtask.task}`));
            }
            if (subtask.subtasks && subtask.subtasks.length > 0) {
                this.printSubtasks(subtask.subtasks, indent + 2);
            }
        });
    }
    addToWorkLog(action, detail) {
        const timestamp = new Date().toLocaleTimeString();
        this.workLog.push(`[${timestamp}] ${action}: ${detail}`);
    }
    showWorkLog() {
        console.log(chalk_1.default.bold('\n📜 Work Log:'));
        if (this.workLog.length === 0) {
            console.log(chalk_1.default.gray('  No work logged yet'));
        }
        else {
            this.workLog.slice(-20).forEach(log => {
                console.log(chalk_1.default.gray(`  ${log}`));
            });
        }
    }
    showStats() {
        const stats = this.orchestrator.getStatistics();
        console.log(chalk_1.default.bold('\n📊 Statistics:'));
        console.log(chalk_1.default.gray(`  Total tasks processed: ${stats.tasksProcessed}`));
        console.log(chalk_1.default.gray(`  Agents: ${stats.agentPool.totalAgents} total`));
        console.log(chalk_1.default.gray(`  Completed: ${stats.agentPool.totalCompleted}`));
        console.log(chalk_1.default.gray(`  Failed: ${stats.agentPool.totalFailed}`));
    }
    async changeModel(newModel) {
        const spinner = (0, ora_1.default)(`Switching to model: ${newModel}...`).start();
        this.model = newModel;
        // Check if model exists
        try {
            await execAsync(`ollama list | grep ${newModel}`);
        }
        catch {
            // Model doesn't exist, pull it
            spinner.text = `Pulling model ${newModel}... (this may take a few minutes)`;
            try {
                await execAsync(`ollama pull ${newModel}`);
            }
            catch (error) {
                spinner.fail(`Failed to pull model ${newModel}`);
                console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
                return;
            }
        }
        // Recreate orchestrator with new model
        this.orchestrator = new Orchestrator_1.Orchestrator({
            ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: newModel,
            maxConcurrentAgents: 3,
            maxTaskDepth: 2,
            logger: this.logger
        });
        try {
            await this.orchestrator.initialize();
            this.setupOrchestratorListeners();
            spinner.succeed(`Switched to ${newModel}`);
        }
        catch (error) {
            spinner.fail(`Failed to switch model: ${error}`);
        }
    }
    handleExit() {
        console.log(chalk_1.default.yellow('\n\nGoodbye! 👋\n'));
        if (this.ollamaProcess) {
            this.ollamaProcess.kill();
        }
        process.exit(0);
    }
}
// Start the CLI
const ui = new ClaudeLikeUI();
ui.start().catch(error => {
    console.error(chalk_1.default.red('Failed to start:'), error);
    process.exit(1);
});
//# sourceMappingURL=claude-cli.js.map