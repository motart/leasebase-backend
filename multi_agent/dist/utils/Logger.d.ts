export declare class Logger {
    private winston;
    constructor(level?: string);
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
    success(message: string): void;
    task(message: string): void;
    agent(agentId: string, message: string): void;
}
//# sourceMappingURL=Logger.d.ts.map