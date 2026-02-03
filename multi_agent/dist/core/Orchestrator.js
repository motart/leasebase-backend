"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const TaskDecomposer_1 = require("./TaskDecomposer");
const AgentPool_1 = require("./AgentPool");
const OllamaClient_1 = require("../clients/OllamaClient");
const Logger_1 = require("../utils/Logger");
const events_1 = require("events");
class Orchestrator extends events_1.EventEmitter {
    taskDecomposer;
    agentPool;
    ollama;
    logger;
    executionPlan;
    results;
    constructor(config) {
        super();
        this.logger = config.logger || new Logger_1.Logger();
        this.ollama = new OllamaClient_1.OllamaClient(this.logger, {
            baseUrl: config.ollamaUrl,
            model: config.model
        });
        this.taskDecomposer = new TaskDecomposer_1.TaskDecomposer(this.ollama, this.logger);
        this.agentPool = new AgentPool_1.AgentPool(this.ollama, this.logger, config.maxConcurrentAgents || 5);
        this.results = new Map();
        this.agentPool.on('message', (message) => {
            this.handleAgentMessage(message);
        });
    }
    async initialize() {
        this.logger.info('Checking Ollama connection...');
        const isHealthy = await this.ollama.checkHealth();
        if (!isHealthy) {
            throw new Error('Ollama is not running. Please start Ollama with: ollama serve');
        }
        const models = await this.ollama.listModels();
        const currentModel = this.ollama.getModel();
        if (models.length === 0) {
            this.logger.warn(`No models found. Pulling ${currentModel}...`);
            await this.ollama.pullModel(currentModel);
        }
        else if (!models.includes(currentModel)) {
            this.logger.warn(`Model ${currentModel} not found. Available models: ${models.join(', ')}`);
            if (models.length > 0) {
                this.ollama.setModel(models[0]);
                this.logger.info(`Using model: ${models[0]}`);
            }
            else {
                await this.ollama.pullModel(currentModel);
            }
        }
        this.logger.success(`Connected to Ollama. Using model: ${this.ollama.getModel()}`);
    }
    async execute(taskDescription, context) {
        this.logger.info(`Starting orchestration for: ${taskDescription}`);
        this.emit('start', { task: taskDescription });
        try {
            const decomposition = await this.taskDecomposer.decompose(taskDescription, context, 2 // Reduced depth to prevent too many subtasks
            );
            this.executionPlan = this.taskDecomposer.createExecutionPlan(decomposition);
            this.emit('plan_created', {
                mainTask: decomposition.mainTask,
                subtaskCount: decomposition.subtasks.length,
                levels: this.executionPlan.executionOrder.length
            });
            const result = await this.executeplan(this.executionPlan);
            this.emit('complete', { result });
            return result;
        }
        catch (error) {
            this.logger.error(`Orchestration failed: ${error}`);
            this.emit('error', { error });
            throw error;
        }
    }
    async executeplan(plan) {
        const { tasks, executionOrder } = plan;
        for (let levelIndex = executionOrder.length - 1; levelIndex >= 0; levelIndex--) {
            const level = executionOrder[levelIndex];
            this.logger.info(`Executing level ${levelIndex + 1}/${executionOrder.length} with ${level.length} tasks`);
            this.emit('level_start', {
                level: levelIndex,
                taskCount: level.length
            });
            const levelPromises = level.map(async (taskId) => {
                const task = tasks.get(taskId);
                if (!task)
                    return null;
                if (task.children.length > 0) {
                    const childResults = task.children
                        .map(childId => this.results.get(childId))
                        .filter(result => result !== undefined);
                    if (childResults.length > 0) {
                        task.context = `Subtask results:\n${JSON.stringify(childResults, null, 2)}`;
                    }
                }
                try {
                    const result = await this.agentPool.executeTask(task);
                    this.results.set(taskId, result);
                    return result;
                }
                catch (error) {
                    this.logger.error(`Task ${taskId} failed: ${error}`);
                    this.results.set(taskId, { error: error instanceof Error ? error.message : String(error) });
                    return null;
                }
            });
            await Promise.all(levelPromises);
            this.emit('level_complete', {
                level: levelIndex,
                results: level.map(id => this.results.get(id))
            });
        }
        await this.agentPool.waitForCompletion();
        const mainTaskId = Array.from(tasks.values()).find(t => !t.parent)?.id;
        return mainTaskId ? this.aggregateResults(mainTaskId, tasks) : this.results;
    }
    aggregateResults(taskId, tasks) {
        const task = tasks.get(taskId);
        if (!task)
            return null;
        const result = {
            task: task.description,
            status: task.status,
            result: this.results.get(taskId)
        };
        if (task.children.length > 0) {
            result.subtasks = task.children.map(childId => this.aggregateResults(childId, tasks)).filter(r => r !== null);
        }
        return result;
    }
    handleAgentMessage(message) {
        this.emit('agent_message', message);
        switch (message.type) {
            case 'task_assignment':
                this.logger.debug(`Task ${message.taskId} assigned to ${message.agentId}`);
                break;
            case 'task_result':
                this.logger.debug(`Task ${message.taskId} completed by ${message.agentId}`);
                break;
            case 'error':
                this.logger.error(`Task ${message.taskId} failed on ${message.agentId}: ${message.payload.error}`);
                break;
        }
    }
    getStatistics() {
        return {
            agentPool: this.agentPool.getStatistics(),
            tasksProcessed: this.results.size,
            executionPlan: this.executionPlan ? {
                totalTasks: this.executionPlan.tasks.size,
                levels: this.executionPlan.executionOrder.length
            } : null
        };
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=Orchestrator.js.map