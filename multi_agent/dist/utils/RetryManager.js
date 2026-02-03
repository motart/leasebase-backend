"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryManager = void 0;
class RetryManager {
    config;
    logger;
    retryCount;
    constructor(logger, config) {
        this.logger = logger;
        this.config = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            ...config
        };
        this.retryCount = new Map();
    }
    async executeWithRetry(taskId, operation, onRetry) {
        const attempts = this.retryCount.get(taskId) || 0;
        try {
            const result = await operation();
            this.retryCount.delete(taskId);
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (attempts >= this.config.maxRetries) {
                this.logger.error(`Task ${taskId} failed after ${attempts} retries: ${err.message}`);
                this.retryCount.delete(taskId);
                throw err;
            }
            const nextAttempt = attempts + 1;
            this.retryCount.set(taskId, nextAttempt);
            const delay = this.calculateDelay(nextAttempt);
            this.logger.warn(`Task ${taskId} failed (attempt ${nextAttempt}/${this.config.maxRetries}). Retrying in ${delay}ms...`);
            if (onRetry) {
                onRetry(nextAttempt, err);
            }
            await this.sleep(delay);
            return this.executeWithRetry(taskId, operation, onRetry);
        }
    }
    calculateDelay(attemptNumber) {
        const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
        const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
        return Math.min(jitteredDelay, this.config.maxDelay);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    shouldRetry(task, error) {
        const retryableErrors = [
            'rate_limit_error',
            'timeout',
            'connection_error',
            'temporary_failure'
        ];
        const errorMessage = error.message.toLowerCase();
        const isRetryable = retryableErrors.some(retryableError => errorMessage.includes(retryableError));
        const attempts = this.retryCount.get(task.id) || 0;
        return isRetryable && attempts < this.config.maxRetries;
    }
    getRetryCount(taskId) {
        return this.retryCount.get(taskId) || 0;
    }
    resetRetries(taskId) {
        this.retryCount.delete(taskId);
    }
    clearAll() {
        this.retryCount.clear();
    }
}
exports.RetryManager = RetryManager;
//# sourceMappingURL=RetryManager.js.map