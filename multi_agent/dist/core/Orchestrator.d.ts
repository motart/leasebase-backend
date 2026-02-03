import { Logger } from '../utils/Logger';
import { EventEmitter } from 'events';
export interface OrchestratorConfig {
    ollamaUrl?: string;
    model?: string;
    maxConcurrentAgents?: number;
    maxTaskDepth?: number;
    logger?: Logger;
}
export declare class Orchestrator extends EventEmitter {
    private taskDecomposer;
    private agentPool;
    private ollama;
    private logger;
    private executionPlan?;
    private results;
    constructor(config: OrchestratorConfig);
    initialize(): Promise<void>;
    execute(taskDescription: string, context?: string): Promise<any>;
    private executeplan;
    private aggregateResults;
    private handleAgentMessage;
    getStatistics(): {
        agentPool: {
            totalAgents: number;
            idleAgents: number;
            busyAgents: number;
            totalCompleted: number;
            totalFailed: number;
        };
        tasksProcessed: number;
        executionPlan: {
            totalTasks: number;
            levels: number;
        } | null;
    };
}
//# sourceMappingURL=Orchestrator.d.ts.map