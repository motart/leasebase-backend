export interface Task {
    id: string;
    description: string;
    context?: string;
    parent?: string;
    children: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: any;
    error?: string;
    agentId?: string;
    depth: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface Agent {
    id: string;
    type: 'master' | 'worker';
    status: 'idle' | 'busy' | 'error';
    currentTask?: string;
    completedTasks: number;
    failedTasks: number;
}
export interface TaskDecomposition {
    mainTask: Task;
    subtasks: Task[];
}
export interface AgentMessage {
    type: 'task_assignment' | 'task_result' | 'error' | 'status_update';
    agentId: string;
    taskId?: string;
    payload: any;
    timestamp: Date;
}
export interface ExecutionPlan {
    tasks: Map<string, Task>;
    dependencies: Map<string, string[]>;
    executionOrder: string[][];
}
//# sourceMappingURL=index.d.ts.map