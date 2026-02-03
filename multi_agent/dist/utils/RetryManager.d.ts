import { Task } from '../types';
import { Logger } from './Logger';
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}
export declare class RetryManager {
    private config;
    private logger;
    private retryCount;
    constructor(logger: Logger, config?: Partial<RetryConfig>);
    executeWithRetry<T>(taskId: string, operation: () => Promise<T>, onRetry?: (attemptNumber: number, error: Error) => void): Promise<T>;
    private calculateDelay;
    private sleep;
    shouldRetry(task: Task, error: Error): boolean;
    getRetryCount(taskId: string): number;
    resetRetries(taskId: string): void;
    clearAll(): void;
}
//# sourceMappingURL=RetryManager.d.ts.map