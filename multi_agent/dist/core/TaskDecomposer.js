"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDecomposer = void 0;
const crypto_1 = require("crypto");
class TaskDecomposer {
    ollama;
    logger;
    constructor(ollama, logger) {
        this.ollama = ollama;
        this.logger = logger;
    }
    async decompose(taskDescription, context, maxDepth = 3) {
        this.logger.info(`Decomposing task: ${taskDescription}`);
        const mainTask = {
            id: (0, crypto_1.randomUUID)(),
            description: taskDescription,
            context,
            children: [],
            status: 'pending',
            depth: 0,
            createdAt: new Date()
        };
        const subtasks = await this.generateSubtasks(mainTask, maxDepth);
        return {
            mainTask,
            subtasks
        };
    }
    async generateSubtasks(parentTask, maxDepth) {
        if (parentTask.depth >= maxDepth) {
            return [];
        }
        const prompt = `You are a task decomposition expert. Break down the following task into smaller, actionable subtasks.

Task: ${parentTask.description}
${parentTask.context ? `Context: ${parentTask.context}` : ''}

Requirements:
1. Each subtask should be concrete and actionable
2. Subtasks should be independent when possible
3. Return a JSON array of subtask descriptions
4. Include EXACTLY 3-5 subtasks (no more!)
5. Each subtask should be completable by a single agent
6. Keep subtask descriptions short and simple

Return ONLY a JSON array of strings, each string being a subtask description.
Example: ["Subtask 1 description", "Subtask 2 description", "Subtask 3 description"]`;
        try {
            const response = await this.ollama.chat([
                { role: 'user', content: prompt }
            ]);
            const subtaskDescriptions = this.parseSubtasks(response);
            const subtasks = [];
            for (const description of subtaskDescriptions) {
                const subtask = {
                    id: (0, crypto_1.randomUUID)(),
                    description,
                    parent: parentTask.id,
                    children: [],
                    status: 'pending',
                    depth: parentTask.depth + 1,
                    createdAt: new Date()
                };
                parentTask.children.push(subtask.id);
                subtasks.push(subtask);
                if (subtask.depth < maxDepth - 1 && this.shouldDecomposeForther(description)) {
                    const nestedSubtasks = await this.generateSubtasks(subtask, maxDepth);
                    subtasks.push(...nestedSubtasks);
                }
            }
            return subtasks;
        }
        catch (error) {
            this.logger.error(`Error generating subtasks: ${error}`);
            return [];
        }
    }
    parseSubtasks(content) {
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => typeof item === 'string').slice(0, 5);
                }
            }
            const lines = content.split('\n')
                .filter(line => line.trim())
                .filter(line => /^[-•*\d]/.test(line.trim()))
                .map(line => line.replace(/^[-•*\d]+\.?\s*/, '').trim())
                .filter(line => line.length > 0)
                .slice(0, 5);
            return lines.length > 0 ? lines : ['Analyze requirements', 'Implement solution', 'Test and validate'];
        }
        catch (error) {
            this.logger.error(`Error parsing subtasks: ${error}`);
            return ['Analyze requirements', 'Implement solution', 'Test and validate'];
        }
    }
    shouldDecomposeForther(description) {
        const complexityKeywords = ['implement', 'design', 'create system', 'build', 'develop'];
        return complexityKeywords.some(keyword => description.toLowerCase().includes(keyword));
    }
    createExecutionPlan(decomposition) {
        const tasks = new Map();
        const dependencies = new Map();
        tasks.set(decomposition.mainTask.id, decomposition.mainTask);
        decomposition.subtasks.forEach(task => tasks.set(task.id, task));
        decomposition.subtasks.forEach(task => {
            if (task.parent) {
                const deps = dependencies.get(task.id) || [];
                dependencies.set(task.id, deps);
            }
        });
        const executionOrder = this.topologicalSort(tasks, dependencies);
        return {
            tasks,
            dependencies,
            executionOrder
        };
    }
    topologicalSort(tasks, dependencies) {
        const levels = [];
        const depths = new Map();
        tasks.forEach(task => {
            const depth = task.depth;
            if (!depths.has(depth)) {
                depths.set(depth, []);
            }
            depths.get(depth).push(task.id);
        });
        const sortedDepths = Array.from(depths.keys()).sort((a, b) => b - a);
        sortedDepths.forEach(depth => {
            levels.push(depths.get(depth));
        });
        return levels;
    }
}
exports.TaskDecomposer = TaskDecomposer;
//# sourceMappingURL=TaskDecomposer.js.map