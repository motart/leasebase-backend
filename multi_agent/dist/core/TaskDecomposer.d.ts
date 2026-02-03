import { TaskDecomposition, ExecutionPlan } from '../types';
import { OllamaClient } from '../clients/OllamaClient';
import { Logger } from '../utils/Logger';
export declare class TaskDecomposer {
    private ollama;
    private logger;
    constructor(ollama: OllamaClient, logger: Logger);
    decompose(taskDescription: string, context?: string, maxDepth?: number): Promise<TaskDecomposition>;
    private generateSubtasks;
    private parseSubtasks;
    private shouldDecomposeForther;
    createExecutionPlan(decomposition: TaskDecomposition): ExecutionPlan;
    private topologicalSort;
}
//# sourceMappingURL=TaskDecomposer.d.ts.map