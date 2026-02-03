import { Task } from '../types';
import { OllamaClient } from '../clients/OllamaClient';
import { Logger } from '../utils/Logger';
import { EventEmitter } from 'events';
export declare class AgentPool extends EventEmitter {
    private agents;
    private ollama;
    private queue;
    private logger;
    private retryManager;
    private maxConcurrentAgents;
    constructor(ollama: OllamaClient, logger: Logger, maxConcurrentAgents?: number);
    private initializeAgents;
    executeTask(task: Task): Promise<any>;
    private runTaskWithOllama;
    private getAvailableAgent;
    private emitMessage;
    waitForCompletion(): Promise<void>;
    getStatistics(): {
        totalAgents: number;
        idleAgents: number;
        busyAgents: number;
        totalCompleted: number;
        totalFailed: number;
    };
}
//# sourceMappingURL=AgentPool.d.ts.map