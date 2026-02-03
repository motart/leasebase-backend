"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPool = void 0;
const p_queue_1 = __importDefault(require("p-queue"));
const RetryManager_1 = require("../utils/RetryManager");
const events_1 = require("events");
class AgentPool extends events_1.EventEmitter {
    agents;
    ollama;
    queue;
    logger;
    retryManager;
    maxConcurrentAgents;
    constructor(ollama, logger, maxConcurrentAgents = 5) {
        super();
        this.agents = new Map();
        this.ollama = ollama;
        this.logger = logger;
        this.retryManager = new RetryManager_1.RetryManager(logger);
        this.maxConcurrentAgents = maxConcurrentAgents;
        this.queue = new p_queue_1.default({ concurrency: maxConcurrentAgents });
        this.initializeAgents();
    }
    initializeAgents() {
        const masterAgent = {
            id: 'master',
            type: 'master',
            status: 'idle',
            completedTasks: 0,
            failedTasks: 0
        };
        this.agents.set(masterAgent.id, masterAgent);
        for (let i = 0; i < this.maxConcurrentAgents; i++) {
            const agent = {
                id: `worker-${i}`,
                type: 'worker',
                status: 'idle',
                completedTasks: 0,
                failedTasks: 0
            };
            this.agents.set(agent.id, agent);
        }
    }
    async executeTask(task) {
        const availableAgent = this.getAvailableAgent();
        if (!availableAgent) {
            await this.queue.onIdle();
            return this.executeTask(task);
        }
        availableAgent.status = 'busy';
        availableAgent.currentTask = task.id;
        task.agentId = availableAgent.id;
        task.status = 'in_progress';
        task.startedAt = new Date();
        this.emitMessage({
            type: 'task_assignment',
            agentId: availableAgent.id,
            taskId: task.id,
            payload: { task },
            timestamp: new Date()
        });
        return this.queue.add(async () => {
            try {
                const result = await this.retryManager.executeWithRetry(task.id, () => this.runTaskWithOllama(task, availableAgent), (attemptNumber, error) => {
                    this.logger.warn(`Retrying task ${task.id} (attempt ${attemptNumber}): ${error.message}`);
                });
                task.status = 'completed';
                task.result = result;
                task.completedAt = new Date();
                availableAgent.completedTasks++;
                this.emitMessage({
                    type: 'task_result',
                    agentId: availableAgent.id,
                    taskId: task.id,
                    payload: { result },
                    timestamp: new Date()
                });
                return result;
            }
            catch (error) {
                task.status = 'failed';
                task.error = error instanceof Error ? error.message : String(error);
                task.completedAt = new Date();
                availableAgent.failedTasks++;
                this.emitMessage({
                    type: 'error',
                    agentId: availableAgent.id,
                    taskId: task.id,
                    payload: { error: task.error },
                    timestamp: new Date()
                });
                throw error;
            }
            finally {
                availableAgent.status = 'idle';
                availableAgent.currentTask = undefined;
            }
        });
    }
    async runTaskWithOllama(task, agent) {
        this.logger.info(`Agent ${agent.id} executing task: ${task.description}`);
        const systemPrompt = `You are a helpful AI assistant. Be concise and direct.`;
        const userPrompt = `Task: ${task.description}
${task.context ? `Context: ${task.context}` : ''}

Provide a brief, practical response focusing on the key points.`;
        try {
            const response = await this.ollama.chat([
                { role: 'user', content: userPrompt }
            ], systemPrompt);
            return response;
        }
        catch (error) {
            this.logger.error(`Agent ${agent.id} failed to execute task ${task.id}: ${error}`);
            throw error;
        }
    }
    getAvailableAgent() {
        for (const agent of this.agents.values()) {
            if (agent.type === 'worker' && agent.status === 'idle') {
                return agent;
            }
        }
        return undefined;
    }
    emitMessage(message) {
        this.emit('message', message);
        this.logger.debug(`Agent message: ${JSON.stringify(message)}`);
    }
    async waitForCompletion() {
        await this.queue.onIdle();
    }
    getStatistics() {
        const stats = {
            totalAgents: this.agents.size,
            idleAgents: 0,
            busyAgents: 0,
            totalCompleted: 0,
            totalFailed: 0
        };
        this.agents.forEach(agent => {
            if (agent.status === 'idle')
                stats.idleAgents++;
            if (agent.status === 'busy')
                stats.busyAgents++;
            stats.totalCompleted += agent.completedTasks;
            stats.totalFailed += agent.failedTasks;
        });
        return stats;
    }
}
exports.AgentPool = AgentPool;
//# sourceMappingURL=AgentPool.js.map