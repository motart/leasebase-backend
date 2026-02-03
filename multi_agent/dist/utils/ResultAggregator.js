"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultAggregator = exports.SummaryAggregator = exports.HierarchicalAggregator = void 0;
class HierarchicalAggregator {
    aggregate(results, tasks) {
        const rootTask = Array.from(tasks.values()).find(t => !t.parent);
        if (!rootTask)
            return {};
        return this.buildHierarchy(rootTask.id, results, tasks);
    }
    buildHierarchy(taskId, results, tasks) {
        const task = tasks.get(taskId);
        if (!task)
            return null;
        const node = {
            id: task.id,
            description: task.description,
            status: task.status,
            depth: task.depth,
            result: results.get(taskId),
            executionTime: task.completedAt && task.startedAt
                ? task.completedAt.getTime() - task.startedAt.getTime()
                : null
        };
        if (task.children.length > 0) {
            node.children = task.children
                .map(childId => this.buildHierarchy(childId, results, tasks))
                .filter(child => child !== null);
        }
        return node;
    }
}
exports.HierarchicalAggregator = HierarchicalAggregator;
class SummaryAggregator {
    aggregate(results, tasks) {
        const summary = {
            totalTasks: tasks.size,
            completed: 0,
            failed: 0,
            pending: 0,
            totalExecutionTime: 0,
            tasksByDepth: new Map(),
            results: []
        };
        tasks.forEach((task, taskId) => {
            switch (task.status) {
                case 'completed':
                    summary.completed++;
                    break;
                case 'failed':
                    summary.failed++;
                    break;
                case 'pending':
                    summary.pending++;
                    break;
            }
            const depthCount = summary.tasksByDepth.get(task.depth) || 0;
            summary.tasksByDepth.set(task.depth, depthCount + 1);
            if (task.completedAt && task.startedAt) {
                summary.totalExecutionTime += task.completedAt.getTime() - task.startedAt.getTime();
            }
            if (results.has(taskId)) {
                summary.results.push({
                    taskId,
                    description: task.description,
                    status: task.status,
                    result: results.get(taskId)
                });
            }
        });
        return {
            ...summary,
            tasksByDepth: Object.fromEntries(summary.tasksByDepth),
            averageExecutionTime: summary.completed > 0
                ? summary.totalExecutionTime / summary.completed
                : 0
        };
    }
}
exports.SummaryAggregator = SummaryAggregator;
class ResultAggregator {
    strategy;
    constructor(strategy = new HierarchicalAggregator()) {
        this.strategy = strategy;
    }
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    aggregate(results, tasks) {
        return this.strategy.aggregate(results, tasks);
    }
    static mergeResults(results) {
        if (results.length === 0)
            return null;
        if (results.length === 1)
            return results[0];
        const merged = {
            combinedResults: results,
            summary: {
                totalResults: results.length,
                successCount: results.filter(r => !r.error).length,
                failureCount: results.filter(r => r.error).length
            }
        };
        const allText = results
            .filter(r => typeof r === 'string')
            .join('\n\n');
        if (allText) {
            merged.textSummary = allText;
        }
        return merged;
    }
}
exports.ResultAggregator = ResultAggregator;
//# sourceMappingURL=ResultAggregator.js.map